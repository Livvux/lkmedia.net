import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import type { OutgoingMail } from "../../src/lib/mailer";
import { handleOnboarding, hatOnboarding } from "../../src/lib/onboarding-submit";
import { KUNDEN_REPO, sessionHash } from "../../src/lib/pipeline";
import { createRateLimiter } from "../../src/lib/handwerk-submit";
import { aenderungUrl } from "../../src/lib/stripe";
import { createGitHubFake } from "./helpers/github-fake";

const SID = "cs_test_onboarding987";
const FORM_EMAIL = "betrieb@example.test";
const STRIPE_EMAIL = "kaeufer@example.test";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const PDF = new TextEncoder().encode("%PDF-1.4 kein Bild");

type D = { sessionId: string; name: string; email: string };

function form(o: { logo?: File[]; fotos?: File[]; fields?: Record<string, string> } = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    session_id: SID,
    name: "Muster GmbH",
    email: FORM_EMAIL,
    ...o.fields,
  }))
    f.set(k, v);
  for (const file of o.logo ?? []) f.append("logo", file);
  for (const file of o.fotos ?? []) f.append("fotos", file);
  return f;
}
const png = (name: string) => new File([PNG], name, { type: "image/png" });

function setup(o: { paid?: boolean; stripeKey?: string | undefined } = {}) {
  const fake = createGitHubFake();
  const mails: OutgoingMail[] = [];
  let t = Date.UTC(2026, 9, 9, 8, 0, 0);
  const limiter = createRateLimiter(1, 60_000, () => t);
  const deps = {
    stripeKey: "stripeKey" in o ? o.stripeKey : "sk_test_x",
    checkSession: vi.fn(async () => ({ paid: o.paid ?? true, email: STRIPE_EMAIL })),
    parse: (f: FormData) => {
      const name = String(f.get("name") ?? "");
      if (!name) return { ok: false as const, errors: ["Name fehlt"] };
      const d: D = {
        sessionId: String(f.get("session_id")),
        name,
        email: String(f.get("email")),
      };
      return { ok: true as const, data: d };
    },
    toYaml: (d: D, y: { datum: string; sessionHash: string }) =>
      `name: ${JSON.stringify(d.name)}\ndatum: "${y.datum}"\nstripe_session_hash: "${y.sessionHash}"\n`,
    name: (d: D) => d.name,
    replyTo: (d: D) => d.email,
    gh: fake.gh as typeof fake.gh | null,
    send: vi.fn(async (m: OutgoingMail) => {
      mails.push(m);
    }),
    allow: limiter,
    release: limiter.release,
    now: () => new Date(t),
    deliveryPromise: "Vorschau in 7 Werktagen.",
    danke: "/fahrschule-webdesign/danke",
    onboardingPfad: "/fahrschule-webdesign/onboarding",
  };
  const run = (f = form()) => handleOnboarding({ produkt: "fahrschulweb", form: f }, deps);
  return { fake, mails, deps, run, tick: (ms: number) => (t += ms) };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  const logs = JSON.stringify(vi.mocked(console.error).mock.calls);
  for (const s of [SID, FORM_EMAIL, STRIPE_EMAIL]) expect(logs).not.toContain(s);
  vi.restoreAllMocks();
});

describe("handleOnboarding", () => {
  it("legt Issue an, mailt Lucas mit kunde.yaml und bestätigt an die Stripe-Adresse", async () => {
    const s = setup();
    const r = await s.run(form({ logo: [png("Logo.png")], fotos: [png("team.png")] }));

    expect(r).toEqual({ status: 303, location: "/fahrschule-webdesign/danke?nr=1" });
    expect(s.fake.issues.get(KUNDEN_REPO)?.length).toBe(1);
    const hash = await sessionHash(SID);
    expect(s.fake.commits[0].paths).toEqual([
      `inbox/fahrschulweb-${hash}/kunde.yaml`,
      `inbox/fahrschulweb-${hash}/logo.png`,
      `inbox/fahrschulweb-${hash}/fotos/team.png`,
    ]);

    expect(s.mails).toHaveLength(2);
    const [lucas, kunde] = s.mails;
    expect(lucas).toMatchObject({
      to: "lucas@lkmedia.net",
      replyTo: FORM_EMAIL,
      subject: "fahrschulweb Onboarding: Muster GmbH",
    });
    expect(lucas.attachments.map((a) => a.filename)).toEqual(["kunde.yaml"]);
    const yaml = parse(lucas.attachments[0].content.toString("utf8"));
    expect(yaml).toMatchObject({ stripe_session_hash: hash, datum: "2026-10-09" });

    expect(kunde.to).toBe(STRIPE_EMAIL);
    expect(kunde.replyTo).toBe("lucas@lkmedia.net");
    expect(kunde.text).toContain(aenderungUrl(SID));
    expect(s.mails.some((m) => m.to === FORM_EMAIL)).toBe(false);
  });

  it("meldet einen neuen Stand derselben Session ohne neues Issue", async () => {
    const s = setup();
    await s.run();
    s.tick(61_000);
    expect(await s.run()).toEqual({ status: 303, location: "/fahrschule-webdesign/danke?nr=1" });
    expect(s.fake.issues.get(KUNDEN_REPO)?.length).toBe(1);
    expect(s.mails[2].subject).toBe("fahrschulweb Neuer Stand: Muster GmbH");
    expect(s.mails[3].subject).toContain("neuer Stand");
  });

  it("GitHub wirft → trotzdem Erfolg, Backup-Mail mit Präfix und Bildern", async () => {
    const s = setup();
    s.fake.gh.commitFiles = async () => {
      throw new DOMException("zu langsam", "TimeoutError");
    };
    const r = await s.run(form({ logo: [png("logo.png")], fotos: [png("a.png"), png("b.png")] }));

    expect(r).toEqual({ status: 303, location: "/fahrschule-webdesign/danke" });
    const lucas = s.mails[0];
    expect(lucas.subject).toBe("[GitHub fehlgeschlagen] fahrschulweb Onboarding: Muster GmbH");
    expect(lucas.attachments.map((a) => [a.filename, a.contentType])).toEqual([
      ["kunde.yaml", "text/yaml"],
      ["logo.png", "image/png"],
      ["a.png", "image/png"],
      ["b.png", "image/png"],
    ]);
    expect(Buffer.isBuffer(lucas.attachments[1].content)).toBe(true);
    expect(s.mails[1].to).toBe(STRIPE_EMAIL);
    expect(vi.mocked(console.error).mock.calls.flat().join(" ")).toContain("TimeoutError");
  });

  it("ohne GitHub-Token (gh null) → Backup-Mail mit Präfix", async () => {
    const s = setup();
    s.deps.gh = null;
    expect((await s.run()).status).toBe(303);
    expect(s.mails[0].subject.startsWith("[GitHub fehlgeschlagen] ")).toBe(true);
  });

  it("GitHub wirft und Lucas-Mail wirft → 502", async () => {
    const s = setup();
    s.fake.gh.commitFiles = async () => {
      throw new Error("500");
    };
    s.deps.send.mockRejectedValueOnce(new Error("smtp down"));
    const r = await s.run();
    expect(r.status).toBe(502);
    expect("body" in r && r.body).toContain("lucas@lkmedia.net");
    expect(s.deps.send).toHaveBeenCalledTimes(1);
  });

  it("nach 502 sperrt der sofortige Wiederholungsversuch nicht", async () => {
    const s = setup();
    s.fake.gh.commitFiles = async () => {
      throw new Error("500");
    };
    s.deps.send.mockRejectedValueOnce(new Error("smtp down"));
    expect((await s.run()).status).toBe(502);
    expect(await s.run()).toEqual({ status: 303, location: "/fahrschule-webdesign/danke" });
  });

  it("zwei gleichzeitige Absendungen → nur ein submitOnboarding, zweite 429", async () => {
    const s = setup();
    const spy = vi.spyOn(s.fake.gh, "commitFiles");
    const [a, b] = await Promise.all([s.run(), s.run()]);
    expect([a.status, b.status].sort()).toEqual([303, 429]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Backup-Mail mit Bildern zu groß → zweiter Versuch nur mit kunde.yaml", async () => {
    const s = setup();
    s.deps.gh = null;
    s.deps.send.mockImplementation(async (m: OutgoingMail) => {
      if (m.attachments.length > 1) throw new Error("552 message too large");
      s.mails.push(m);
    });
    const r = await s.run(form({ logo: [png("logo.png")], fotos: [png("a.png")] }));
    expect(r).toEqual({ status: 303, location: "/fahrschule-webdesign/danke" });
    const lucas = s.mails[0];
    expect(lucas.subject.startsWith("[GitHub fehlgeschlagen] ")).toBe(true);
    expect(lucas.attachments.map((a) => a.filename)).toEqual(["kunde.yaml"]);
    expect(lucas.text).toContain("Bilder zu groß für die Mail – bitte beim Kunden anfordern.");
  });

  it("Backup-Mail scheitert auch ohne Bilder und GitHub fehlt → 502", async () => {
    const s = setup();
    s.deps.gh = null;
    s.deps.send.mockRejectedValue(new Error("smtp down"));
    const r = await s.run(form({ logo: [png("logo.png")] }));
    expect(r.status).toBe(502);
    expect(s.deps.send).toHaveBeenCalledTimes(2);
  });

  it("GitHub ok, Lucas-Mail wirft → trotzdem Erfolg", async () => {
    const s = setup();
    s.deps.send.mockRejectedValueOnce(new Error("smtp down"));
    expect((await s.run()).status).toBe(303);
  });

  it("Doppelklick innerhalb 60 s → 429, nur ein Issue", async () => {
    const s = setup();
    const spy = vi.spyOn(s.fake.gh, "commitFiles");
    expect((await s.run()).status).toBe(303);
    s.tick(30_000);
    expect(await s.run()).toEqual({
      status: 429,
      body: "Ihre Angaben sind gerade erst angekommen. Bitte in einer Minute erneut.",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(s.fake.issues.get(KUNDEN_REPO)?.length).toBe(1);
  });

  it("unbezahlt → 403, kein GitHub, keine Mail, sperrt die Session nicht", async () => {
    const s = setup({ paid: false });
    expect((await s.run()).status).toBe(403);
    expect(s.fake.commits).toHaveLength(0);
    expect(s.mails).toHaveLength(0);
    s.deps.checkSession.mockResolvedValue({ paid: true, email: STRIPE_EMAIL });
    expect((await s.run()).status).toBe(303);
  });

  it("kein Stripe-Key → 503", async () => {
    const s = setup({ stripeKey: undefined });
    const r = await s.run();
    expect(r.status).toBe(503);
    expect(s.deps.checkSession).not.toHaveBeenCalled();
  });

  it("Honeypot → 303 danke ohne Verarbeitung", async () => {
    const s = setup();
    const r = await s.run(form({ fields: { website: "spam" } }));
    expect(r).toEqual({ status: 303, location: "/fahrschule-webdesign/danke" });
    expect(s.deps.checkSession).not.toHaveBeenCalled();
    expect(s.mails).toHaveLength(0);
  });

  it("Parser-Fehler → zurück aufs Formular mit Meldung", async () => {
    const s = setup();
    const r = await s.run(form({ fields: { name: "" } }));
    expect(r.status).toBe(303);
    const loc = new URL(("location" in r && r.location) || "", "https://x");
    expect(loc.pathname).toBe("/fahrschule-webdesign/onboarding");
    expect(loc.searchParams.get("session_id")).toBe(SID);
    expect(loc.searchParams.get("fehler")).toBe("Name fehlt");
  });

  it("Logo als PDF → zurück mit Upload-Fehlertext", async () => {
    const s = setup();
    const r = await s.run(form({ logo: [new File([PDF], "logo.png")] }));
    const loc = new URL(("location" in r && r.location) || "", "https://x");
    expect(r.status).toBe(303);
    expect(loc.pathname).toBe("/fahrschule-webdesign/onboarding");
    expect(loc.searchParams.get("fehler")).toBe(
      "„logo.png“ ist kein unterstütztes Bild. Möglich sind JPG, PNG, WebP und SVG.",
    );
    expect(s.deps.checkSession).not.toHaveBeenCalled();
  });

  it("mehr als ein Logo → Fehler", async () => {
    const s = setup();
    const r = await s.run(form({ logo: [png("a.png"), png("b.png")] }));
    expect("location" in r && r.location).toContain("fehler=");
  });

  it("zusammen mehr als 40 MB → Fehler", async () => {
    const s = setup();
    const big = () => {
      const b = new Uint8Array(7 * 1024 * 1024);
      b.set(PNG);
      return new File([b], "gross.png");
    };
    const r = await s.run(form({ fotos: Array.from({ length: 6 }, big) }));
    const loc = new URL(("location" in r && r.location) || "", "https://x");
    expect(loc.searchParams.get("fehler")).toBe(
      "Die Bilder sind zusammen größer als 40 MB. Bitte weniger oder kleinere Bilder auswählen.",
    );
  });
});

describe("hatOnboarding", () => {
  it("ohne GitHub false, mit Neukunden-Issue true", async () => {
    const fake = createGitHubFake();
    expect(await hatOnboarding(null, SID)).toBe(false);
    expect(await hatOnboarding(fake.gh, SID)).toBe(false);
    fake.addIssue(KUNDEN_REPO, {
      labels: ["neukunde", "docweb"],
      body: `session:${await sessionHash(SID)}`,
    });
    expect(await hatOnboarding(fake.gh, SID)).toBe(true);
  });

  it("GitHub-Fehler zählt als nicht gefunden und wird ohne Session-ID geloggt", async () => {
    const fake = createGitHubFake();
    fake.gh.listIssues = async () => {
      throw new TypeError("boom");
    };
    expect(await hatOnboarding(fake.gh, SID)).toBe(false);
    expect(console.error).toHaveBeenCalledWith("[onboarding] findOnboarding failed: TypeError");
  });
});
