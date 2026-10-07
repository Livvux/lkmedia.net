// handwerkweb – Projektanfrage und Kurzbewerbung von Kunden-Websites (Endpoint /api/handwerk/…).
// Feldnamen und Auswahlwerte sind der Vertrag mit dem Template (handwerkweb/src/pages/anfrage.astro).

export const ANLIEGEN = [
  "Heizungstausch",
  "Wärmepumpe",
  "Badsanierung",
  "Wartung",
  "Elektroinstallation/Sanierung",
  "Wallbox",
  "Photovoltaik",
  "E-Check",
  "Reparatur/Störung",
  "Sonstiges",
] as const;
export const OBJEKTART = ["Einfamilienhaus", "Mehrfamilienhaus", "Wohnung", "Gewerbe"] as const;
export const ZEITRAHMEN = [
  "So schnell wie möglich",
  "In 1–3 Monaten",
  "Später / in Planung",
] as const;
export const ERFAHRUNG = [
  "Auszubildende/r",
  "Geselle/Gesellin",
  "Meister/in oder Techniker/in",
  "Quereinsteiger/in",
] as const;

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const CV_TYPES = [...IMAGE_TYPES, "application/pdf"];
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;
/** Schneller ausgefüllt = Bot. `dauer` setzt ein Inline-Script; ohne JS fehlt es → kein Urteil. */
const MIN_FILL_MS = 3000;

export interface Attachment {
  filename: string;
  contentType: string;
  content: Buffer;
}
export interface MailContent {
  subject: string;
  text: string;
  replyTo?: string;
  attachments: Attachment[];
}
export type Grund = "pflichtfelder" | "plz" | "email" | "auswahl" | "dateien";
export type FormResult = { ok: true; mail: MailContent } | { ok: false; grund: Grund };

const str = (f: FormData, k: string, max = 200) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const oneOf = (v: string, list: readonly string[]) => !v || list.includes(v);
const fail = (grund: Grund): FormResult => ({ ok: false, grund });
const rows = (r: [string, string][]) =>
  r
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

export function isBot(f: FormData): boolean {
  if (str(f, "website")) return true;
  const dauer = str(f, "dauer");
  return dauer !== "" && Number(dauer) < MIN_FILL_MS;
}

async function collectFiles(
  f: FormData,
  field: string,
  allowed: readonly string[],
): Promise<Attachment[] | null> {
  const files = f.getAll(field).filter((v): v is File => typeof v !== "string" && v.size > 0);
  if (files.length > MAX_FILES) return null;
  if (files.reduce((n, x) => n + x.size, 0) > MAX_TOTAL_BYTES) return null;
  if (files.some((x) => !allowed.includes(x.type))) return null;
  return Promise.all(
    files.map(async (x, i) => ({
      filename: x.name.replace(/[^\w.\- äöüÄÖÜß]/g, "_").slice(0, 100) || `datei-${i + 1}`,
      contentType: x.type,
      content: Buffer.from(await x.arrayBuffer()),
    })),
  );
}

export async function parseAnfrage(f: FormData, plzPraefixe: string[]): Promise<FormResult> {
  const anliegen = str(f, "anliegen");
  const plz = str(f, "plz", 10);
  const ort = str(f, "ort", 100);
  const objektart = str(f, "objektart");
  const baujahr = str(f, "baujahr", 4);
  const zeitrahmen = str(f, "zeitrahmen");
  const beschreibung = str(f, "beschreibung", 3000);
  const name = str(f, "name", 120);
  const telefon = str(f, "telefon", 40);
  const email = str(f, "email", 120);
  const rueckruf = str(f, "rueckruf") === "ja";
  const erreichbarkeit = str(f, "erreichbarkeit");

  if (!anliegen || !plz || !beschreibung || !name || !telefon || !email)
    return fail("pflichtfelder");
  if (!/^\d{5}$/.test(plz)) return fail("plz");
  if (!EMAIL.test(email)) return fail("email");
  if (!ANLIEGEN.includes(anliegen as (typeof ANLIEGEN)[number])) return fail("auswahl");
  if (!oneOf(objektart, OBJEKTART) || !oneOf(zeitrahmen, ZEITRAHMEN)) return fail("auswahl");
  const attachments = await collectFiles(f, "fotos", IMAGE_TYPES);
  if (!attachments) return fail("dateien");

  const ausserhalb = plzPraefixe.length > 0 && !plzPraefixe.some((p) => plz.startsWith(p));
  const subject = oneLine(
    `${ausserhalb ? "[außerhalb Einsatzgebiet] " : ""}Anfrage: ${anliegen} · ${plz} ${ort} · ${name}`,
  );
  const text = `Neue Projektanfrage über Ihre Website.

${rows([
  ["Anliegen", anliegen],
  ["PLZ / Ort", `${plz} ${ort}`.trim()],
  ["Objektart", objektart],
  ["Baujahr", baujahr],
  ["Zeitrahmen", zeitrahmen],
  ["Name", name],
  ["Telefon", telefon],
  ["E-Mail", email],
  ["Rückruf erwünscht", rueckruf ? "ja" : "nein"],
  ["Erreichbarkeit", erreichbarkeit],
  ["Fotos", attachments.length ? `${attachments.length} im Anhang` : "keine"],
])}${ausserhalb ? "\n\nHinweis: Die PLZ liegt außerhalb Ihres hinterlegten Einsatzgebiets." : ""}

Beschreibung:
${beschreibung}`;

  return { ok: true, mail: { subject, text, replyTo: email, attachments } };
}

export async function parseBewerbung(f: FormData): Promise<FormResult> {
  const stelle = str(f, "stelle", 120);
  const name = str(f, "name", 120);
  const telefon = str(f, "telefon", 40);
  const email = str(f, "email", 120);
  const erfahrung = str(f, "erfahrung");
  const fuehrerschein = str(f, "fuehrerschein", 4);
  const nachricht = str(f, "nachricht", 2000);

  if (!stelle || !name || !telefon || !erfahrung) return fail("pflichtfelder");
  if (email && !EMAIL.test(email)) return fail("email");
  if (!ERFAHRUNG.includes(erfahrung as (typeof ERFAHRUNG)[number])) return fail("auswahl");
  if (!oneOf(fuehrerschein, ["ja", "nein"])) return fail("auswahl");
  const attachments = await collectFiles(f, "lebenslauf", CV_TYPES);
  if (!attachments) return fail("dateien");

  const text = `Neue Bewerbung über Ihre Website.

${rows([
  ["Stelle", stelle],
  ["Name", name],
  ["Telefon", telefon],
  ["E-Mail", email],
  ["Erfahrung", erfahrung],
  ["Führerschein Klasse B", fuehrerschein],
  ["Lebenslauf", attachments.length ? "im Anhang" : "nicht beigefügt"],
])}${nachricht ? `\n\nNachricht:\n${nachricht}` : ""}

Bitte melden Sie sich zeitnah – gute Fachkräfte haben meist mehrere Angebote.`;

  return {
    ok: true,
    mail: {
      subject: oneLine(`Bewerbung: ${stelle} · ${name}`),
      text,
      ...(email && { replyTo: email }),
      attachments,
    },
  };
}
