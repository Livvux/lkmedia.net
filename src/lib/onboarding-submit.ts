// Gemeinsamer Onboarding-Ablauf nach Stripe-Checkout (docweb, handwerkweb, fahrschulweb).
// GitHub ist der Hauptweg, die Mail an Lucas das Backup: Scheitert GitHub, zählt die Mail.
import type { GitHub } from "./github";
import type { Produkt } from "./kunden-schema";
import { onboardingBestaetigung } from "./kundenmails";
import type { Attachment } from "./mail-types";
import type { OutgoingMail } from "./mailer";
import { findOnboarding, KUNDEN_REPO, sessionHash, submitOnboarding } from "./pipeline";
import { readUploads, UPLOAD_LIMITS, type Upload } from "./uploads";

const TO = "lucas@lkmedia.net";
const NICHT_VERFUEGBAR =
  "Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.";
const ZU_GROSS =
  "Die Bilder sind zusammen größer als 40 MB. Bitte weniger oder kleinere Bilder auswählen.";
const MIME: Record<Upload["ext"], string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

type ParseResult<D> = { ok: true; data: D } | { ok: false; errors: string[] };

export type OnboardingDeps<D> = {
  stripeKey?: string;
  checkSession: (id: string, key: string) => Promise<{ paid: boolean; email?: string }>;
  parse: (f: FormData) => ParseResult<D>;
  toYaml: (d: D, o: { datum: string; sessionHash: string }) => string;
  name: (d: D) => string;
  replyTo: (d: D) => string;
  gh: GitHub | null;
  send: (m: OutgoingMail) => Promise<void>;
  /** Reserviert die Session (Doppelklick-Sperre); `release` gibt sie nach Fehlschlag frei. */
  allow: (key: string) => boolean;
  release: (key: string) => void;
  now: () => Date;
  deliveryPromise: string;
  danke: string;
  onboardingPfad: string;
};

export type OnboardingResult =
  | { status: 303; location: string }
  | { status: 400 | 403 | 429 | 502 | 503; body: string };

const errName = (e: unknown) => (e instanceof Error ? e.name : "unknown");

export async function handleOnboarding<D extends { sessionId: string }>(
  i: { produkt: Produkt; form: FormData },
  deps: OnboardingDeps<D>,
): Promise<OnboardingResult> {
  const { produkt, form } = i;
  if (form.get("website")) return { status: 303, location: deps.danke }; // honeypot

  const zurueck = (fehler: string): OnboardingResult => {
    const q = new URLSearchParams({ session_id: String(form.get("session_id") ?? ""), fehler });
    return { status: 303, location: `${deps.onboardingPfad}?${q}` };
  };
  const parsed = deps.parse(form);
  if (!parsed.ok) return zurueck(parsed.errors.join(" · "));

  if (!deps.stripeKey) {
    console.error(`[onboarding] ${produkt} STRIPE_SECRET_KEY unset – rejecting`);
    return { status: 503, body: NICHT_VERFUEGBAR };
  }
  const d = parsed.data;
  const session = await deps.checkSession(d.sessionId, deps.stripeKey);
  if (!session.paid) return { status: 403, body: "Bestellung nicht gefunden oder nicht bezahlt." };

  // Bilder erst nach dem Bezahlt-Check lesen: Unbezahlte erreichen den SVG-Parser nie.
  const logo = await readUploads(form, "logo", { max: 1 });
  if (!logo.ok) return zurueck(logo.fehler);
  const fotos = await readUploads(form, "fotos", { max: 10 });
  if (!fotos.ok) return zurueck(fotos.fehler);
  const bilder = [...logo.files, ...fotos.files];
  if (bilder.reduce((n, u) => n + u.bytes.length, 0) > UPLOAD_LIMITS.gesamtBytes) {
    return zurueck(ZU_GROSS);
  }
  // Erst nach dem Bezahlt-Check zählen, damit unbezahlte Versuche niemanden aussperren.
  // allow() reserviert synchron, also bekommt auch ein paralleler zweiter Klick 429.
  const key = `onb:${d.sessionId}`;
  if (!deps.allow(key)) {
    return {
      status: 429,
      body: "Ihre Angaben sind gerade erst angekommen. Bitte in einer Minute erneut.",
    };
  }
  let r: OnboardingResult | undefined;
  try {
    r = await einreichen(produkt, d, session, logo.files, fotos.files, deps);
    return r;
  } finally {
    if (r?.status !== 303) deps.release(key); // nur Erfolge sperren
  }
}

async function einreichen<D extends { sessionId: string }>(
  produkt: Produkt,
  d: D,
  session: { email?: string },
  logo: Upload[],
  fotos: Upload[],
  deps: OnboardingDeps<D>,
): Promise<OnboardingResult> {
  const name = deps.name(d);
  const hash = await sessionHash(d.sessionId);
  const yaml = deps.toYaml(d, { datum: deps.now().toISOString().slice(0, 10), sessionHash: hash });
  let ergebnis: { issue: number; neu: boolean } | null = null;
  if (deps.gh) {
    try {
      ergebnis = await submitOnboarding(deps.gh, {
        produkt,
        name,
        sessionId: d.sessionId,
        stripeEmail: session.email,
        yaml,
        logo,
        fotos,
        now: deps.now,
      });
    } catch (e) {
      console.error(`[onboarding] ${produkt} github failed: ${errName(e)}`);
    }
  } else {
    console.error(`[onboarding] ${produkt} github failed: GITHUB_KUNDEN_TOKEN unset`);
  }
  const githubOk = ergebnis !== null;
  const neu = ergebnis?.neu ?? true;

  const anhaenge: Attachment[] = [
    { filename: "kunde.yaml", contentType: "text/yaml", content: Buffer.from(yaml, "utf8") },
    ...(githubOk
      ? []
      : [...logo.map((u) => ({ ...u, name: `logo.${u.ext}` })), ...fotos].map((u) => ({
          filename: u.name,
          contentType: MIME[u.ext],
          content: Buffer.from(u.bytes),
        }))),
  ];
  const art = neu ? "Onboarding" : "Neuer Stand";
  const praefix = githubOk ? "" : "[GitHub fehlgeschlagen] ";
  const issueZeile = githubOk
    ? `Issue: https://github.com/${KUNDEN_REPO}/issues/${ergebnis?.issue}`
    : `GitHub fehlgeschlagen – Issue bitte von Hand anlegen (Body-Zeile: session:${hash}). Bilder im Anhang.`;
  const backup = {
    to: TO,
    replyTo: deps.replyTo(d),
    subject: `${praefix}${produkt} ${art}: ${name}`.replace(/\s+/g, " "),
    text: `${produkt} ${art}.\n\nName: ${name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\nSession-Hash: ${hash}\n${issueZeile}\n\nkunde.yaml im Anhang – enthält immer den vollständigen aktuellen Stand.`,
  };
  const versuche: OutgoingMail[] = [{ ...backup, attachments: anhaenge }];
  // Bilder können das SMTP-Limit sprengen – dann wenigstens kunde.yaml retten.
  if (anhaenge.length > 1) {
    versuche.push({
      ...backup,
      text: `${backup.text}\n\nBilder zu groß für die Mail – bitte beim Kunden anfordern.`,
      attachments: anhaenge.slice(0, 1),
    });
  }
  let backupOk = false;
  for (const m of versuche) {
    try {
      await deps.send(m);
      backupOk = true;
      break;
    } catch (e) {
      console.error(`[onboarding] ${produkt} backup mail failed: ${errName(e)}`);
    }
  }
  if (!backupOk && !githubOk) {
    return {
      status: 502,
      body: "Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.",
    };
  }

  // Bestätigung nur an die bei Stripe hinterlegte Käufer-Adresse, nie an Formulareingaben.
  if (session.email) {
    const m = onboardingBestaetigung({
      produkt,
      name,
      sessionId: d.sessionId,
      deliveryPromise: deps.deliveryPromise,
      neu,
    });
    await deps
      .send({ to: session.email, replyTo: TO, ...m, attachments: [] })
      .catch((e: unknown) =>
        console.error(`[onboarding] ${produkt} confirmation mail failed: ${errName(e)}`),
      );
  }
  // Vorgangsnummer nur, wenn das Issue wirklich existiert.
  return { status: 303, location: ergebnis ? `${deps.danke}?nr=${ergebnis.issue}` : deps.danke };
}

/** Hat diese Session schon ein Onboarding-Issue? GitHub-Fehler zählen als „nein“. */
export async function hatOnboarding(gh: GitHub | null, sessionId: string): Promise<boolean> {
  if (!gh) return false;
  try {
    return (await findOnboarding(gh, sessionId)) !== null;
  } catch (e) {
    console.error(`[onboarding] findOnboarding failed: ${errName(e)}`);
    return false;
  }
}

/** Übersetzt das Ergebnis in eine HTTP-Antwort. */
export const toResponse = (r: OnboardingResult): Response =>
  "location" in r
    ? new Response(null, { status: 303, headers: { Location: r.location } })
    : new Response(r.body, { status: r.status });
