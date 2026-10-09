import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleAenderung,
  handleAntwort,
  resolveZugang,
  type Zugang,
} from "../../src/lib/aenderung-submit";
import { createRateLimiter } from "../../src/lib/handwerk-submit";
import type { Kunde } from "../../src/lib/kunden";
import type { OutgoingMail } from "../../src/lib/mailer";
import { KUNDEN_REPO, sessionHash } from "../../src/lib/pipeline";
import { checkAnySession, PAYMENT_LINKS } from "../../src/lib/stripe";
import { createGitHubFake } from "./helpers/github-fake";

const SID = "cs_test_aenderung123";
const STRIPE_EMAIL = "kaeufer@example.test";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

const KUNDE: Kunde = {
  id: "fahrschule-test",
  produkt: "fahrschulweb",
  name: "Fahrschule Test",
  status: "live",
  stripe: { session: SID, email: STRIPE_EMAIL },
  repo: "Livvux/fahrschule-test",
};

const registryMit = (kunden: Kunde[] | null) => ({
  all: async () => kunden,
  bySession: async (s: string) => kunden?.find((k) => k.stripe.session === s),
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("checkAnySession", () => {
  const stripe = (body: object, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("takes the product from the payment link", async () => {
    const f = stripe({
      payment_status: "paid",
      payment_link: PAYMENT_LINKS.fahrschulweb,
      customer_details: { email: STRIPE_EMAIL },
    });
    expect(await checkAnySession(SID, "sk", f)).toEqual({
      paid: true,
      produkt: "fahrschulweb",
      email: STRIPE_EMAIL,
    });
  });

  it("rejects foreign payment links, unpaid sessions and unknown ids", async () => {
    expect(
      await checkAnySession(SID, "sk", stripe({ payment_status: "paid", payment_link: "plink_x" })),
    ).toEqual({ paid: false });
    expect(
      await checkAnySession(
        SID,
        "sk",
        stripe({ payment_status: "unpaid", payment_link: PAYMENT_LINKS.docweb }),
      ),
    ).toEqual({ paid: false });
    expect(await checkAnySession(SID, "sk", stripe({}, 404))).toEqual({ paid: false });
    expect(await checkAnySession("nope", "sk", stripe({}))).toEqual({ paid: false });
  });

  it("ignores empty payment links", async () => {
    const f = stripe({ payment_status: "paid", payment_link: "" });
    expect(await checkAnySession(SID, "sk", f)).toEqual({ paid: false });
  });

  it("throws when Stripe itself fails", async () => {
    await expect(checkAnySession(SID, "sk", stripe({}, 500))).rejects.toThrow();
  });
});

describe("resolveZugang", () => {
  function deps(o: {
    paid?: boolean;
    produkt?: "docweb" | "handwerkweb" | "fahrschulweb";
    kunden?: Kunde[] | null;
    stripeKey?: string;
  }) {
    const fake = createGitHubFake();
    return {
      fake,
      deps: {
        stripeKey: "stripeKey" in o ? o.stripeKey : "sk_test",
        checkAnySession: vi.fn(async () =>
          o.paid === false
            ? { paid: false }
            : { paid: true, produkt: o.produkt ?? "fahrschulweb", email: STRIPE_EMAIL },
        ),
        registry: registryMit(o.kunden === undefined ? [KUNDE] : o.kunden),
        gh: fake.gh,
      },
    };
  }

  it("unpaid session → 403 without access", async () => {
    const { deps: d } = deps({ paid: false });
    const z = await resolveZugang(SID, d);
    expect(z).toMatchObject({ ok: false, status: 403 });
  });

  it("no Stripe key → 503", async () => {
    const { deps: d } = deps({ stripeKey: undefined });
    expect(await resolveZugang(SID, d)).toMatchObject({ ok: false, status: 503 });
    expect(d.checkAnySession).not.toHaveBeenCalled();
  });

  it("Stripe error → 503", async () => {
    const { deps: d } = deps({});
    d.checkAnySession.mockRejectedValueOnce(new Error("down"));
    expect(await resolveZugang(SID, d)).toMatchObject({ ok: false, status: 503 });
  });

  it("customer from the register, product from the payment link", async () => {
    const { deps: d } = deps({});
    expect(await resolveZugang(SID, d)).toEqual({
      ok: true,
      sessionId: SID,
      produkt: "fahrschulweb",
      email: STRIPE_EMAIL,
      kunde: KUNDE,
      name: "Fahrschule Test",
    });
  });

  it("register entry of another product → 403", async () => {
    const { deps: d } = deps({ produkt: "docweb" });
    expect(await resolveZugang(SID, d)).toMatchObject({ ok: false, status: 403 });
  });

  it("only an onboarding issue → name from its title", async () => {
    const { deps: d, fake } = deps({ produkt: "docweb", kunden: [] });
    fake.addIssue(KUNDEN_REPO, {
      title: "Neukunde docweb: Praxis Dr. Muster",
      body: `session:${await sessionHash(SID)}`,
      labels: ["neukunde", "docweb"],
    });
    expect(await resolveZugang(SID, d)).toMatchObject({
      ok: true,
      produkt: "docweb",
      kunde: null,
      name: "Praxis Dr. Muster",
    });
  });

  it("onboarding issue of another product → 403", async () => {
    const { deps: d, fake } = deps({ produkt: "docweb", kunden: [] });
    fake.addIssue(KUNDEN_REPO, {
      title: "Neukunde fahrschulweb: X",
      body: `session:${await sessionHash(SID)}`,
      labels: ["neukunde", "fahrschulweb"],
    });
    expect(await resolveZugang(SID, d)).toMatchObject({ ok: false, status: 403 });
  });

  it("neither customer nor onboarding → 403 with onboarding link", async () => {
    const { deps: d } = deps({ produkt: "docweb", kunden: [] });
    const z = await resolveZugang(SID, d);
    expect(z).toMatchObject({
      ok: false,
      status: 403,
      text: "Zu diesem Link gibt es noch keine Angaben. Bitte füllen Sie zuerst das Onboarding aus.",
      link: { href: `/docweb/onboarding?session_id=${SID}` },
    });
  });

  it("unreadable register or missing GitHub → 503", async () => {
    expect(await resolveZugang(SID, deps({ kunden: null }).deps)).toMatchObject({ status: 503 });
    expect(await resolveZugang(SID, { ...deps({}).deps, gh: null })).toMatchObject({
      status: 503,
    });
  });

  it("GitHub error while looking up the onboarding → 503", async () => {
    const { deps: d, fake } = deps({ kunden: [] });
    fake.gh.listIssues = async () => {
      throw new Error("down");
    };
    expect(await resolveZugang(SID, d)).toMatchObject({ ok: false, status: 503 });
  });
});

describe("handleAenderung", () => {
  const zugang = (o: Partial<Extract<Zugang, { ok: true }>> = {}): Extract<Zugang, { ok: true }> => ({
    ok: true,
    sessionId: SID,
    produkt: "fahrschulweb",
    email: STRIPE_EMAIL,
    kunde: KUNDE,
    name: "Fahrschule Test",
    ...o,
  });
  const form = (fields: Record<string, string>, bilder: File[] = []) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    for (const b of bilder) f.append("bilder", b);
    return f;
  };
  function setup() {
    const fake = createGitHubFake();
    const mails: OutgoingMail[] = [];
    const allow = createRateLimiter(10, 86_400_000);
    const uhr = { t: Date.UTC(2026, 9, 9, 8, 0, 0) };
    return {
      fake,
      mails,
      uhr,
      deps: {
        recent: new Map(),
        now: () => uhr.t,
        gh: fake.gh,
        send: async (m: OutgoingMail) => {
          mails.push(m);
        },
        allow,
        release: allow.release,
      },
    };
  }
  const gueltig = { kategorie: "preise", text: "Bitte Klasse B auf 70 € ändern." };

  it("category not offered for the product → field error", async () => {
    const { deps } = setup();
    const r = await handleAenderung(
      zugang({ produkt: "docweb", kunde: null }),
      form({ ...gueltig, kategorie: "fahrzeuge" }),
      deps,
    );
    expect(r).toMatchObject({ ok: false, fehler: { kategorie: expect.any(String) } });
  });

  it("text of 5 characters → field error, values come back", async () => {
    const { deps, fake } = setup();
    const r = await handleAenderung(zugang(), form({ kategorie: "preise", text: "kurz " }), deps);
    expect(r).toEqual({
      ok: false,
      fehler: { text: expect.any(String) },
      werte: { kategorie: "preise", text: "kurz " },
    });
    expect(fake.issues.size).toBe(0);
  });

  it("text over 5000 characters → field error", async () => {
    const { deps } = setup();
    const r = await handleAenderung(zugang(), form({ ...gueltig, text: "x".repeat(5001) }), deps);
    expect(r).toMatchObject({ ok: false, fehler: { text: expect.any(String) } });
  });

  it("invalid image → field error at bilder", async () => {
    const { deps } = setup();
    const pdf = new File([new TextEncoder().encode("%PDF-1.4")], "a.png", { type: "image/png" });
    const r = await handleAenderung(zugang(), form(gueltig, [pdf]), deps);
    expect(r).toMatchObject({ ok: false, fehler: { bilder: expect.stringContaining("a.png") } });
  });

  it("honeypot → pretends success, creates nothing", async () => {
    const { deps, fake } = setup();
    const r = await handleAenderung(zugang(), form({ ...gueltig, website: "spam" }), deps);
    expect(r).toMatchObject({ ok: true, vorgang: 0 });
    expect(fake.issues.size).toBe(0);
  });

  it("11th order of the day → form error", async () => {
    const { deps } = setup();
    const auftrag = (i: number) => form({ ...gueltig, text: `${gueltig.text} (${i})` });
    for (let i = 0; i < 10; i++) {
      expect(await handleAenderung(zugang(), auftrag(i), deps)).toMatchObject({ ok: true });
    }
    const r = await handleAenderung(zugang(), auftrag(10), deps);
    expect(r).toMatchObject({
      ok: false,
      fehler: {
        form: "Sie haben heute schon 10 Aufträge geschickt. Bitte melden Sie sich morgen wieder oder schreiben Sie an lucas@lkmedia.net.",
      },
    });
  });

  it("GitHub throws → form error, values unchanged, attempt not counted", async () => {
    const { deps, fake } = setup();
    fake.gh.createIssue = async () => {
      throw new Error("down");
    };
    const werte = { kategorie: "texte", text: "  Neuer Text für die Startseite.\n" };
    const r = await handleAenderung(zugang(), form(werte), deps);
    expect(r).toEqual({
      ok: false,
      fehler: {
        form: "Das hat gerade nicht geklappt. Ihr Text ist noch da – bitte in ein paar Minuten noch einmal absenden.",
      },
      werte,
    });
    for (let i = 0; i < 10; i++) deps.allow(`aend:${SID}`);
    expect(deps.allow(`aend:${SID}`)).toBe(false);
  });

  it("success → issue with image, confirmation mail to the Stripe address", async () => {
    const { deps, fake, mails } = setup();
    const r = await handleAenderung(
      zugang(),
      form(gueltig, [new File([PNG], "Preis.png", { type: "image/png" })]),
      deps,
    );
    expect(r).toEqual({ ok: true, vorgang: 1, ziel: "kunde" });
    expect(fake.issues.get("Livvux/fahrschule-test")?.[0].labels).toEqual([
      "aenderung",
      "kat:preise",
    ]);
    expect(fake.commits[0].paths).toEqual(["aenderungen/1/preis.png"]);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe(STRIPE_EMAIL);
    expect(mails[0].subject).toContain("Nr. 1");
    expect(mails[0].text).toContain("Vorgang Nr. 1");
  });

  it("success without Stripe email → no mail, mail errors are swallowed", async () => {
    const { deps, mails } = setup();
    expect(await handleAenderung(zugang({ email: undefined }), form(gueltig), deps)).toMatchObject({
      ok: true,
    });
    expect(mails).toHaveLength(0);
    deps.send = async () => {
      throw new Error("smtp");
    };
    const anderer = form({ ...gueltig, text: "Bitte die Öffnungszeiten ändern." });
    expect(await handleAenderung(zugang(), anderer, deps)).toMatchObject({ ok: true });
  });

  const BILDER_HINWEIS =
    "Bitte wählen Sie die Bilder noch einmal aus – aus Sicherheitsgründen kann der Browser sie nicht behalten.";
  const bild = () => new File([PNG], "foto.png", { type: "image/png" });

  it("error with attached images → asks to pick the images again", async () => {
    const { deps, fake } = setup();
    const kurz = await handleAenderung(zugang(), form({ ...gueltig, text: "kurz" }, [bild()]), deps);
    expect(kurz).toMatchObject({
      ok: false,
      fehler: { text: expect.any(String), bilder: BILDER_HINWEIS },
    });
    fake.gh.createIssue = async () => {
      throw new Error("down");
    };
    const gh = await handleAenderung(zugang(), form(gueltig, [bild()]), deps);
    expect(gh).toMatchObject({ ok: false, fehler: { form: expect.any(String), bilder: BILDER_HINWEIS } });
  });

  it("error without images → no image hint", async () => {
    const { deps } = setup();
    const r = await handleAenderung(zugang(), form({ ...gueltig, text: "kurz" }), deps);
    expect(r).toMatchObject({ ok: false });
    expect(r.ok ? null : r.fehler.bilder).toBeUndefined();
  });

  it("identical double submit within 60 s → one issue, same result", async () => {
    const { deps, fake, mails, uhr } = setup();
    const [a, b] = await Promise.all([
      handleAenderung(zugang(), form(gueltig), deps),
      handleAenderung(zugang(), form(gueltig), deps),
    ]);
    expect(a).toEqual({ ok: true, vorgang: 1, ziel: "kunde" });
    expect(b).toEqual(a);
    uhr.t += 30_000;
    expect(await handleAenderung(zugang(), form(gueltig), deps)).toEqual(a);
    expect(fake.issues.get("Livvux/fahrschule-test")).toHaveLength(1);
    expect(mails).toHaveLength(1);
    uhr.t += 31_000;
    expect(await handleAenderung(zugang(), form(gueltig), deps)).toMatchObject({ vorgang: 2 });
  });

  it("failed submit is not remembered as sent", async () => {
    const { deps, fake } = setup();
    const create = fake.gh.createIssue;
    fake.gh.createIssue = async () => {
      throw new Error("down");
    };
    expect(await handleAenderung(zugang(), form(gueltig), deps)).toMatchObject({ ok: false });
    fake.gh.createIssue = create;
    expect(await handleAenderung(zugang(), form(gueltig), deps)).toMatchObject({ ok: true, vorgang: 1 });
  });
});

describe("handleAntwort", () => {
  const z: Extract<Zugang, { ok: true }> = {
    ok: true,
    sessionId: SID,
    produkt: "fahrschulweb",
    email: STRIPE_EMAIL,
    kunde: KUNDE,
    name: "Fahrschule Test",
  };
  const form = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };

  it("foreign order → general hint, no comment", async () => {
    const fake = createGitHubFake();
    fake.addIssue("Livvux/fremd", { labels: ["aenderung", "rueckfrage"] });
    const r = await handleAntwort(
      z,
      form({ repo: "Livvux/fremd", nr: "1", antwort: "Nur Klasse B." }),
      { gh: fake.gh },
    );
    expect(r).toEqual({
      ok: false,
      fehler: { antwort: "Diese Rückfrage ist bereits beantwortet oder abgeschlossen." },
      werte: { repo: "Livvux/fremd", nr: "1", antwort: "Nur Klasse B." },
    });
    expect(fake.commentsOf("Livvux/fremd", 1)).toHaveLength(0);
  });

  it("empty answer → field error", async () => {
    const fake = createGitHubFake();
    const r = await handleAntwort(z, form({ repo: KUNDE.repo ?? "", nr: "1", antwort: " " }), {
      gh: fake.gh,
    });
    expect(r).toMatchObject({ ok: false, fehler: { antwort: expect.any(String) } });
  });

  it("own open question → comment and label removed", async () => {
    const fake = createGitHubFake();
    const repo = KUNDE.repo ?? "";
    fake.addIssue(repo, {
      body: `x\n\nsession:${await sessionHash(SID)}`,
      labels: ["aenderung", "rueckfrage"],
    });
    const r = await handleAntwort(z, form({ repo, nr: "1", antwort: "Nur Klasse B." }), {
      gh: fake.gh,
    });
    expect(r).toEqual({ ok: true });
    expect(fake.commentsOf(repo, 1)[0].body).toContain("Nur Klasse B.");
    expect(fake.issues.get(repo)?.[0].labels).toEqual(["aenderung"]);
  });

  it("GitHub error → retry hint", async () => {
    const fake = createGitHubFake();
    fake.gh.listIssues = async () => {
      throw new Error("down");
    };
    const r = await handleAntwort(
      z,
      form({ repo: KUNDE.repo ?? "", nr: "1", antwort: "Ja." }),
      { gh: fake.gh },
    );
    expect(r).toMatchObject({ ok: false, fehler: { antwort: expect.stringContaining("nicht geklappt") } });
  });
});
