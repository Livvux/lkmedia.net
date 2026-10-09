// fahrschulweb – Website-Paket für Fahrschulen (Produktseite /fahrschule-webdesign, Onboarding nach Stripe-Checkout).
import { checkPaidSession, SESSION_ID } from "./stripe";

const setupAmount = 1790;
const monthlyAmount = 59;
const minimumTermMonths = 12;
const price = (amount: number) => `${new Intl.NumberFormat("de-DE").format(amount)} €`;

export const FAHRSCHULWEB = {
  setupPrice: price(setupAmount),
  monthlyPrice: price(monthlyAmount),
  initialPrice: price(setupAmount + monthlyAmount),
  minimumTotalPrice: price(setupAmount + monthlyAmount * minimumTermMonths),
  initialAmount: setupAmount + monthlyAmount,
  minimumTermMonths,
  includedLocations: 3,
  deliveryPromise:
    "Sobald Ihre Angaben und die benötigten Bilder vollständig vorliegen, erhalten Sie in der Regel innerhalb von 7 Werktagen eine Vorschau. Wir veröffentlichen Ihre Website nach Ihrer Freigabe.",
  // Stripe Payment Link (öffentlich, kein Secret). Leer = noch nicht eingerichtet → CTA führt zum Gespräch.
  // Success-URL beim Anlegen: https://lkmedia.net/fahrschule-webdesign/onboarding?session_id={CHECKOUT_SESSION_ID}
  paymentLink: "",
  paymentLinkId: "",
} as const;

export const KLASSEN = [
  "AM",
  "Mofa",
  "A1",
  "A2",
  "A",
  "B",
  "B196",
  "B197",
  "BE",
  "C1",
  "C1E",
  "C",
  "CE",
  "D",
  "L",
  "T",
] as const;
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;

export interface Onboarding {
  sessionId: string;
  wunschdomain: string;
  fahrschule: {
    name: string;
    beschreibung: string;
    telefon: string;
    whatsapp: string;
    email: string;
    anmeldeLink: string;
    wunschfarbe: string;
  };
  klassen: (typeof KLASSEN)[number][];
  standort: { strasse: string; plz: string; ort: string; buerozeiten: string };
  weitereStandorte: string;
  theorie: string;
  kurse: string;
  preise: string;
  team: string;
  fahrzeuge: string;
  sprachen: string;
  links: string;
  recht: {
    inhaber: string;
    rechtsform: string;
    erlaubnisbehoerde: string;
    register: string;
    ustId: string;
  };
  hinweise: string;
}

export type ParseResult = { ok: true; data: Onboarding } | { ok: false; errors: string[] };

const str = (f: FormData, k: string, max = 200) =>
  String(f.get(k) ?? "")
    .trim()
    .slice(0, max);

export function parseOnboarding(f: FormData): ParseResult {
  const errors: string[] = [];
  const required = (k: string, label: string, max = 200) => {
    const v = str(f, k, max);
    if (!v) errors.push(`${label} fehlt`);
    return v;
  };

  const sessionId = str(f, "session_id");
  if (!SESSION_ID.test(sessionId)) errors.push("Ungültige Bestellung (session_id)");

  const name = required("fahrschule_name", "Name der Fahrschule");
  const telefon = required("telefon", "Telefon", 40);
  const email = required("email", "E-Mail", 120);
  if (email && !EMAIL.test(email)) errors.push("E-Mail ungültig");
  const anmeldeLink = str(f, "anmelde_link", 500);
  if (anmeldeLink && !/^https:\/\/\S+$/.test(anmeldeLink))
    errors.push("Anmelde-Link muss mit https:// beginnen");
  // Erst prüfen, dann speichern: Abschneiden vor der Prüfung ließe "761234" durchgehen.
  const wunschfarbe = str(f, "wunschfarbe", 100);
  if (wunschfarbe && !/^#[0-9a-fA-F]{6}$/.test(wunschfarbe)) errors.push("Wunschfarbe ungültig");
  const plz = required("plz", "PLZ", 100);
  if (plz && !/^\d{5}$/.test(plz)) errors.push("PLZ muss fünfstellig sein");
  const klassen = KLASSEN.filter((k) => f.getAll("klassen").map(String).includes(k));
  if (!klassen.length) errors.push("Mindestens eine Führerscheinklasse wählen");

  const data: Onboarding = {
    sessionId,
    wunschdomain: str(f, "wunschdomain", 120),
    fahrschule: {
      name,
      beschreibung: str(f, "beschreibung", 1000),
      telefon,
      whatsapp: str(f, "whatsapp", 40),
      email,
      anmeldeLink,
      wunschfarbe,
    },
    klassen,
    standort: {
      strasse: required("strasse", "Straße"),
      plz,
      ort: required("ort", "Ort"),
      buerozeiten: required("buerozeiten", "Bürozeiten", 2000),
    },
    weitereStandorte: str(f, "weitere_standorte", 3000),
    theorie: required("theorie", "Theoriezeiten", 2000),
    kurse: str(f, "kurse", 3000),
    preise: str(f, "preise", 5000),
    team: str(f, "team", 3000),
    fahrzeuge: str(f, "fahrzeuge", 2000),
    sprachen: str(f, "sprachen", 300),
    links: str(f, "links", 2000),
    recht: {
      inhaber: required("inhaber", "Inhaber / Geschäftsführung"),
      rechtsform: str(f, "rechtsform", 100),
      erlaubnisbehoerde: required("erlaubnisbehoerde", "Erlaubnisbehörde"),
      register: str(f, "register"),
      ustId: str(f, "ust_id", 40),
    },
    hinweise: str(f, "hinweise", 3000),
  };

  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// JSON ist gültiges YAML – JSON.stringify quotet jeden Wert sicher (":", "#", Zeilenumbrüche …).
const q = (v: string) => JSON.stringify(v);

/** Erzeugt kunde.yaml für den Website-Build. `aenderung` markiert spätere Korrekturen. */
export function toKundeYaml(d: Onboarding, datum: string, aenderung = false): string {
  const s = d.fahrschule;
  return `# fahrschulweb ${aenderung ? "Änderung – ersetzt frühere Angaben" : "Onboarding"}
bestellung:
  stripe_session: ${q(d.sessionId)}
  datum: ${q(datum)}
  aenderung: ${aenderung}
  wunschdomain: ${q(d.wunschdomain)}

fahrschule:
  name: ${q(s.name)}
  beschreibung: ${q(s.beschreibung)}
  telefon: ${q(s.telefon)}
  whatsapp: ${q(s.whatsapp)}
  email: ${q(s.email)}
  anmelde_link: ${q(s.anmeldeLink)}
  wunschfarbe: ${q(s.wunschfarbe)}

klassen: ${JSON.stringify(d.klassen)}

standorte:
  - strasse: ${q(d.standort.strasse)}
    plz: ${q(d.standort.plz)}
    ort: ${q(d.standort.ort)}
    buerozeiten: ${q(d.standort.buerozeiten)}
weitere_standorte: ${q(d.weitereStandorte)}

theorie: ${q(d.theorie)}
kurse: ${q(d.kurse)}
preise: ${q(d.preise)}
team: ${q(d.team)}
fahrzeuge: ${q(d.fahrzeuge)}
sprachen: ${q(d.sprachen)}
links: ${q(d.links)}

recht:
  inhaber: ${q(d.recht.inhaber)}
  rechtsform: ${q(d.recht.rechtsform)}
  erlaubnisbehoerde: ${q(d.recht.erlaubnisbehoerde)}
  register: ${q(d.recht.register)}
  ust_id: ${q(d.recht.ustId)}

hinweise: ${q(d.hinweise)}
`;
}

export const onboardingUrl = (origin: string, sessionId: string) =>
  `${origin}/fahrschule-webdesign/onboarding?session_id=${encodeURIComponent(sessionId)}`;

export const checkSession = (id: string, secretKey: string, fetchFn: typeof fetch = fetch) =>
  checkPaidSession(id, secretKey, FAHRSCHULWEB.paymentLinkId, fetchFn);
