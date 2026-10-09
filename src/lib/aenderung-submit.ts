// /aenderung: Zugang über den persönlichen Link, Änderungsaufträge und Antworten auf Rückfragen.
import { createGitHub, type GitHub } from "./github";
import type { Kunde, Produkt, Registry } from "./kunden";
import { registry } from "./kunden";
import { aenderungBestaetigung } from "./kundenmails";
import { type OutgoingMail, sendMail } from "./mailer";
import { antworten, findOnboarding, kategorienFuer, submitAenderung } from "./pipeline";
import { checkAnySession } from "./stripe";
import { readUploads } from "./uploads";

const TO = "lucas@lkmedia.net";
const NICHT_VERFUEGBAR =
  "Die Seite ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal oder schreiben Sie an lucas@lkmedia.net.";
const NICHT_BEZAHLT =
  "Zu diesem Link finden wir keine bezahlte Bestellung. Bitte nutzen Sie den Link aus Ihrer Bestätigungsmail oder schreiben Sie an lucas@lkmedia.net.";
const KEIN_ONBOARDING =
  "Zu diesem Link gibt es noch keine Angaben. Bitte füllen Sie zuerst das Onboarding aus.";
const GITHUB_FEHLER =
  "Das hat gerade nicht geklappt. Ihre Eingaben sind noch da – bitte in ein paar Minuten noch einmal absenden.";
const LIMIT =
  "Sie haben heute schon 10 Aufträge geschickt. Bitte melden Sie sich morgen wieder oder schreiben Sie an lucas@lkmedia.net.";
const ABGESCHLOSSEN = "Diese Rückfrage ist bereits beantwortet oder abgeschlossen.";
export const MAX_TEXT = 5000;
const MIN_TEXT = 10;

export const ONBOARDING_PFAD: Record<Produkt, string> = {
  docweb: "/docweb/onboarding",
  handwerkweb: "/handwerk/onboarding",
  fahrschulweb: "/fahrschule-webdesign/onboarding",
};

export type Zugang =
  | {
      ok: true;
      sessionId: string;
      produkt: Produkt;
      email?: string;
      kunde: Kunde | null;
      name: string;
    }
  | { ok: false; status: 403 | 503; text: string; link?: { href: string; label: string } };
type Offen = Extract<Zugang, { ok: true }>;

export type ZugangDeps = {
  stripeKey?: string;
  checkAnySession: (
    id: string,
    key: string,
  ) => Promise<{ paid: boolean; produkt?: Produkt; email?: string }>;
  registry: Pick<Registry, "all" | "bySession">;
  gh: GitHub | null;
};
export type AenderungDeps = ZugangDeps & { send: (m: OutgoingMail) => Promise<void> };

const errName = (e: unknown) => (e instanceof Error ? e.name : "unknown");

/** Echte Abhängigkeiten – oder im Dev-Server mit PIPELINE_FAKE=1 feste Testdaten (e2e). */
export async function aenderungDeps(sessionId: string): Promise<AenderungDeps> {
  if (import.meta.env.DEV && process.env.PIPELINE_FAKE === "1") {
    return (await import("./aenderung-fake")).fakeDeps(sessionId);
  }
  // Statische Zugriffe statt env(k): sonst kann Vite den DEV-Zweig samt Fake nicht entfernen.
  const token = process.env.GITHUB_KUNDEN_TOKEN ?? import.meta.env.GITHUB_KUNDEN_TOKEN;
  return {
    stripeKey: process.env.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY,
    checkAnySession,
    registry,
    gh: token ? createGitHub({ token }) : null,
    send: sendMail,
  };
}

export async function resolveZugang(sessionId: string, deps: ZugangDeps): Promise<Zugang> {
  const nichtVerfuegbar = { ok: false, status: 503, text: NICHT_VERFUEGBAR } as const;
  if (!deps.stripeKey || !deps.gh) {
    console.error("[aenderung] STRIPE_SECRET_KEY oder GITHUB_KUNDEN_TOKEN fehlt");
    return nichtVerfuegbar;
  }
  try {
    const s = await deps.checkAnySession(sessionId, deps.stripeKey);
    if (!s.paid || !s.produkt) return { ok: false, status: 403, text: NICHT_BEZAHLT };
    const basis = { ok: true, sessionId, produkt: s.produkt, email: s.email } as const;
    // Register unlesbar → kein Raten, sonst landen Aufträge von Live-Kunden im Neukunden-Issue.
    if ((await deps.registry.all()) === null) return nichtVerfuegbar;
    const kunde = await deps.registry.bySession(sessionId);
    if (kunde) {
      if (kunde.produkt !== s.produkt) return { ok: false, status: 403, text: NICHT_BEZAHLT };
      return { ...basis, kunde, name: kunde.name };
    }
    const onb = await findOnboarding(deps.gh, sessionId);
    if (!onb) {
      const href = `${ONBOARDING_PFAD[s.produkt]}?session_id=${encodeURIComponent(sessionId)}`;
      return {
        ok: false,
        status: 403,
        text: KEIN_ONBOARDING,
        link: { href, label: "Zum Onboarding" },
      };
    }
    if (onb.produkt !== s.produkt) return { ok: false, status: 403, text: NICHT_BEZAHLT };
    const name = onb.titel.replace(/^Neukunde \S+: /, "").trim() || "Ihre Website";
    return { ...basis, kunde: null, name };
  } catch (e) {
    console.error(`[aenderung] Zugang prüfen fehlgeschlagen: ${errName(e)}`);
    return nichtVerfuegbar;
  }
}

const feld = (form: FormData, k: string) => {
  const v = form.get(k);
  return typeof v === "string" ? v : "";
};

export type AenderungResult =
  | { ok: true; vorgang: number; ziel?: "kunde" | "inbox" | "vertrag" }
  | { ok: false; fehler: Record<string, string>; werte: { kategorie: string; text: string } };

export async function handleAenderung(
  z: Offen,
  form: FormData,
  deps: {
    gh: GitHub;
    send: (m: OutgoingMail) => Promise<void>;
    allow: (key: string) => boolean;
    release: (key: string) => void;
  },
): Promise<AenderungResult> {
  if (form.get("website")) return { ok: true, vorgang: 0 }; // Honeypot
  const werte = { kategorie: feld(form, "kategorie"), text: feld(form, "text") };
  const fehler: Record<string, string> = {};
  if (!kategorienFuer(z.produkt).some((k) => k.id === werte.kategorie)) {
    fehler.kategorie = "Bitte wählen Sie aus, worum es geht.";
  }
  const text = werte.text.trim();
  if (text.length < MIN_TEXT) {
    fehler.text = "Bitte beschreiben Sie Ihren Wunsch in mindestens 10 Zeichen.";
  } else if (text.length > MAX_TEXT) {
    fehler.text = `Bitte höchstens ${MAX_TEXT} Zeichen. Längere Texte können Sie als zweiten Auftrag schicken.`;
  }
  const bilder = await readUploads(form, "bilder", { max: 5 });
  if (!bilder.ok) fehler.bilder = bilder.fehler;
  if (!bilder.ok || Object.keys(fehler).length) return { ok: false, fehler, werte };

  const key = `aend:${z.sessionId}`;
  if (!deps.allow(key)) return { ok: false, fehler: { form: LIMIT }, werte };
  let r: Awaited<ReturnType<typeof submitAenderung>>;
  try {
    r = await submitAenderung(deps.gh, {
      kunde: z.kunde,
      produkt: z.produkt,
      name: z.name,
      sessionId: z.sessionId,
      kategorie: werte.kategorie,
      text,
      bilder: bilder.files,
    });
  } catch (e) {
    deps.release(key); // gescheiterte Versuche zählen nicht
    console.error(`[aenderung] ${z.produkt} github failed: ${errName(e)}`);
    return { ok: false, fehler: { form: GITHUB_FEHLER }, werte };
  }
  // Bestätigung nur an die Stripe-Adresse, nie an Formulareingaben.
  if (z.email) {
    const m = aenderungBestaetigung({ name: z.name, vorgang: r.vorgang, sessionId: z.sessionId });
    await deps
      .send({ to: z.email, replyTo: TO, ...m, attachments: [] })
      .catch((e: unknown) => console.error(`[aenderung] confirmation mail failed: ${errName(e)}`));
  }
  return { ok: true, vorgang: r.vorgang, ziel: r.ziel };
}

export type AntwortResult =
  | { ok: true }
  | {
      ok: false;
      fehler: { antwort: string };
      werte: { repo: string; nr: string; antwort: string };
    };

export async function handleAntwort(
  z: Offen,
  form: FormData,
  deps: { gh: GitHub },
): Promise<AntwortResult> {
  const werte = { repo: feld(form, "repo"), nr: feld(form, "nr"), antwort: feld(form, "antwort") };
  const nein = (antwort: string): AntwortResult => ({ ok: false, fehler: { antwort }, werte });
  const text = werte.antwort.trim();
  if (!text) return nein("Bitte schreiben Sie Ihre Antwort.");
  if (text.length > MAX_TEXT) return nein(`Bitte höchstens ${MAX_TEXT} Zeichen.`);
  if (!/^\d{1,9}$/.test(werte.nr)) return nein(ABGESCHLOSSEN);
  try {
    await antworten(deps.gh, {
      kunde: z.kunde,
      repo: werte.repo,
      nr: Number(werte.nr),
      sessionId: z.sessionId,
      text,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "fremder Auftrag") return nein(ABGESCHLOSSEN);
    console.error(`[aenderung] antworten failed: ${errName(e)}`);
    return nein(GITHUB_FEHLER);
  }
}
