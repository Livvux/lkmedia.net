// handwerkweb – Entscheidet über eine Formular-Einsendung. Reine Logik, Versand/Limit injiziert.
import { isBot, MAX_TOTAL_BYTES, parseAnfrage, parseBewerbung } from "./handwerk-forms";
import { allowedOrigins, findSite } from "./handwerk-sites";
import type { OutgoingMail } from "./mailer";

const FORMS = ["anfrage", "bewerbung"] as const;
/** Dateien + Textfelder + Multipart-Overhead. */
const MAX_BODY = MAX_TOTAL_BYTES + 1024 * 1024;

export interface SubmitInput {
  siteId: string;
  form: string;
  origin: string | null;
  ip: string;
  contentLength: number;
  formData: () => Promise<FormData>;
}
export interface SubmitDeps {
  send: (m: OutgoingMail) => Promise<void>;
  allow: (key: string) => boolean;
  dev: boolean;
}
export type SubmitResult = { status: 303; location: string } | { status: 403 | 404; body: string };

// ponytail: In-Memory, pro Prozess, Neustart leert. Bei mehreren Instanzen Redis o. Ä.
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  const allow = (key: string): boolean => {
    const t = now();
    if (hits.size > 10_000) hits.clear();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    const ok = recent.length < max;
    hits.set(key, ok ? [...recent, t] : recent);
    return ok;
  };
  /** Gibt den zuletzt gezählten Versuch wieder frei (z. B. wenn er gescheitert ist). */
  const release = (key: string): void => {
    const recent = hits.get(key);
    if (recent?.length) hits.set(key, recent.slice(0, -1));
  };
  return Object.assign(allow, { release });
}

export async function handleSubmission(i: SubmitInput, deps: SubmitDeps): Promise<SubmitResult> {
  const site = findSite(i.siteId);
  if (!site || !(FORMS as readonly string[]).includes(i.form)) {
    return { status: 404, body: "Nicht gefunden." };
  }
  if (!i.origin || !allowedOrigins(site, deps.dev).includes(i.origin)) {
    return { status: 403, body: "Herkunft nicht erlaubt." };
  }
  // Redirect-Ziel ist der geprüfte Origin, nie ein Formularfeld.
  const go = (path: string): SubmitResult => ({ status: 303, location: `${i.origin}${path}` });

  if (!(i.contentLength > 0) || i.contentLength > MAX_BODY)
    return go(`/fehler?grund=dateien&f=${i.form}`);
  if (!deps.allow(`${i.siteId}:${i.ip}`)) return go(`/fehler?grund=limit&f=${i.form}`);

  let form: FormData;
  try {
    form = await i.formData();
  } catch {
    return go(`/fehler?grund=pflichtfelder&f=${i.form}`);
  }
  if (isBot(form)) return go(`/danke?f=${i.form}`);

  const parsed =
    i.form === "anfrage" ? await parseAnfrage(form, site.plzPraefixe) : await parseBewerbung(form);
  if (!parsed.ok) return go(`/fehler?grund=${parsed.grund}&f=${i.form}`);

  try {
    await deps.send({ ...parsed.mail, to: site.email });
  } catch (error) {
    // Nur Metadaten loggen (keine personenbezogenen Daten); Absender sieht /fehler mit Telefonnummer.
    console.error("[handwerk] Versand fehlgeschlagen", i.siteId, i.form, error);
    return go(`/fehler?grund=versand&f=${i.form}`);
  }
  return go(`/danke?f=${i.form}`);
}
