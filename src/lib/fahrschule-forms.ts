// fahrschulweb – Anmeldung von Kunden-Websites (Endpoint /api/fahrschule/…).
// Feldnamen sind der Vertrag mit dem Template (fahrschulweb, Anmeldeformular).

import { KLASSEN } from "./fahrschulweb";
import { EMAIL, fail, oneLine, rows, str } from "./handwerk-forms";
import type { FormResult } from "./mail-types";

const MIN_ALTER = 14;
const MAX_ALTER = 99;
const berlinDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });

/** Alter in Jahren am Berliner „heute“; null wenn kein echtes Kalenderdatum (YYYY-MM-DD). */
function alter(geburtsdatum: string, now: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(geburtsdatum);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d)
    return null;
  const [ty, tm, td] = berlinDate.format(now).split("-").map(Number);
  return ty - y - (tm < mo || (tm === mo && td < d) ? 1 : 0);
}

/** Einzeilig: CR/LF und Mehrfach-Leerraum raus (Header-Injection, Betreff). */
const line = (f: FormData, k: string, max: number) => oneLine(str(f, k, max));

export async function parseAnmeldung(f: FormData, now: Date = new Date()): Promise<FormResult> {
  const vorname = line(f, "vorname", 60);
  const nachname = line(f, "nachname", 60);
  const geburtsdatum = str(f, "geburtsdatum", 10);
  const klasse = str(f, "klasse");
  const standort = line(f, "standort", 80);
  const telefon = line(f, "telefon", 40);
  const email = line(f, "email", 120);
  const nachricht = str(f, "nachricht", 2000);

  if (!vorname || !nachname || !geburtsdatum || !klasse || !standort) return fail("pflichtfelder");
  if (!telefon && !email) return fail("pflichtfelder");
  if (str(f, "einwilligung") !== "ja") return fail("pflichtfelder");
  if (email && !EMAIL.test(email)) return fail("email");
  if (!(KLASSEN as readonly string[]).includes(klasse)) return fail("auswahl");
  const jahre = alter(geburtsdatum, now);
  if (jahre === null || jahre < MIN_ALTER || jahre > MAX_ALTER) return fail("alter");

  const [y, m, d] = geburtsdatum.split("-");
  const text = `${rows([
    ["Vorname", vorname],
    ["Nachname", nachname],
    ["Geburtsdatum", `${d}.${m}.${y}`],
    ["Klasse", klasse],
    ["Standort", standort],
    ["Telefon", telefon],
    ["E-Mail", email],
  ])}${nachricht ? `\n\nNachricht:\n${nachricht}` : ""}

Diese Anmeldung kam über Ihre Website. Bitte melden Sie sich innerhalb von zwei Werktagen.`;

  return {
    ok: true,
    mail: {
      subject: `Neue Anmeldung: ${vorname} ${nachname}, Klasse ${klasse}, ${standort}`,
      text,
      ...(email && { replyTo: email }),
      attachments: [],
    },
  };
}
