// docweb – Website-Paket für Arztpraxen (Produktseite /docweb, Onboarding nach Stripe-Checkout).
import { checkPaidSession, SESSION_ID } from "./stripe";

export const DOCWEB = {
  setupPrice: "1.490 €",
  monthlyPrice: "49 €",
  demoUrl: "https://docweb.lkmedia.net",
  // Stripe Payment Link (öffentlich, kein Secret). Success-URL → /docweb/onboarding?session_id=…
  paymentLink: "https://buy.stripe.com/cNi3cw7zU3LL2OMgaGeAg0o",
  paymentLinkId: "plink_1UNQdyJ3L2AI7fPZDrHjVYkn",
} as const;

const TYPES = ["arzt", "psychotherapie", "zahnarzt"] as const;
const BOOKING = ["doctolib", "samedi", "link", "phone", "email"] as const;
const KASSEN = ["gesetzlich", "privat", "selbstzahler"] as const;

export interface Onboarding {
  sessionId: string;
  wunschdomain: string;
  praxis: {
    name: string;
    fachrichtung: string;
    typ: (typeof TYPES)[number];
    beschreibung: string;
    kassen: string[];
    telefon: string;
    email: string;
    booking: { type: (typeof BOOKING)[number]; url: string };
    wunschfarbe: string;
  };
  standort: {
    strasse: string;
    plz: string;
    ort: string;
    oeffnungszeiten: string;
    barrierefreiheit: string;
  };
  team: string;
  leistungen: string;
  faqWuensche: string;
  recht: { kammer: string; kv: string; berufsbezeichnung: string; haftpflicht: string };
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

  const name = required("praxis_name", "Praxisname");
  const fachrichtung = required("fachrichtung", "Fachrichtung");
  const typ = str(f, "typ") as Onboarding["praxis"]["typ"];
  if (!TYPES.includes(typ)) errors.push("Praxistyp ungültig");
  const telefon = required("telefon", "Telefon", 40);
  const email = required("email", "E-Mail", 120);
  if (email && !/^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/.test(email))
    errors.push("E-Mail ungültig");

  const bookingType = str(f, "booking_type") as Onboarding["praxis"]["booking"]["type"];
  if (!BOOKING.includes(bookingType)) errors.push("Terminbuchung ungültig");
  const bookingUrl = str(f, "booking_url", 500);
  if (["doctolib", "samedi", "link"].includes(bookingType) && !/^https:\/\/\S+$/.test(bookingUrl)) {
    errors.push("Link zur Online-Terminbuchung fehlt (https://…)");
  }

  const wunschfarbe = str(f, "wunschfarbe", 7);
  if (wunschfarbe && !/^#[0-9a-fA-F]{6}$/.test(wunschfarbe)) errors.push("Wunschfarbe ungültig");

  const plz = required("plz", "PLZ", 5);
  if (plz && !/^\d{5}$/.test(plz)) errors.push("PLZ muss fünfstellig sein");

  const data: Onboarding = {
    sessionId,
    wunschdomain: str(f, "wunschdomain", 120),
    praxis: {
      name,
      fachrichtung,
      typ,
      beschreibung: str(f, "beschreibung", 1000),
      kassen: f
        .getAll("kassen")
        .map(String)
        .filter((k) => (KASSEN as readonly string[]).includes(k)),
      telefon,
      email,
      booking: { type: bookingType, url: bookingUrl },
      wunschfarbe,
    },
    standort: {
      strasse: required("strasse", "Straße"),
      plz,
      ort: required("ort", "Ort"),
      oeffnungszeiten: required("oeffnungszeiten", "Öffnungszeiten", 2000),
      barrierefreiheit: str(f, "barrierefreiheit", 500),
    },
    team: required("team", "Team", 5000),
    leistungen: required("leistungen", "Leistungen", 5000),
    faqWuensche: str(f, "faq_wuensche", 3000),
    recht: {
      kammer: required("kammer", "Zuständige Kammer"),
      kv: str(f, "kv"),
      berufsbezeichnung: required("berufsbezeichnung", "Berufsbezeichnung"),
      haftpflicht: str(f, "haftpflicht", 300),
    },
    hinweise: str(f, "hinweise", 3000),
  };

  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// JSON ist gültiges YAML – JSON.stringify quotet jeden Wert sicher (":", "#", Zeilenumbrüche …).
const q = (v: string) => JSON.stringify(v);

/** Erzeugt kunde.yaml im Format von docweb/onboarding/kunde.example.yaml. */
export function toKundeYaml(d: Onboarding, datum: string): string {
  const p = d.praxis;
  return `# docweb Onboarding – an den Agent übergeben (siehe docweb/AGENTS.md)
bestellung:
  stripe_session: ${q(d.sessionId)}
  datum: ${q(datum)}
  wunschdomain: ${q(d.wunschdomain)}

praxis:
  name: ${q(p.name)}
  fachrichtung: ${q(p.fachrichtung)}
  typ: ${q(p.typ)}
  slogan: ""
  beschreibung: ${q(p.beschreibung)}
  kassen: ${JSON.stringify(p.kassen)}
  telefon: ${q(p.telefon)}
  email: ${q(p.email)}
  booking:
    type: ${q(p.booking.type)}
    url: ${q(p.booking.url)}
  wunschfarbe: ${q(p.wunschfarbe)}

standorte:
  - strasse: ${q(d.standort.strasse)}
    plz: ${q(d.standort.plz)}
    ort: ${q(d.standort.ort)}
    barrierefreiheit: ${q(d.standort.barrierefreiheit)}
    oeffnungszeiten: ${q(d.standort.oeffnungszeiten)}

team: ${q(d.team)}
leistungen: ${q(d.leistungen)}
faq_wuensche: ${q(d.faqWuensche)}

recht:
  kammer: ${q(d.recht.kammer)}
  kv: ${q(d.recht.kv)}
  berufsbezeichnung: ${q(d.recht.berufsbezeichnung)}
  haftpflicht: ${q(d.recht.haftpflicht)}

hinweise: ${q(d.hinweise)}
`;
}

/** Prüft per Stripe-API, ob die Checkout-Session über den docweb-Link bezahlt ist. */
export const checkSession = (id: string, secretKey: string, fetchFn: typeof fetch = fetch) =>
  checkPaidSession(id, secretKey, DOCWEB.paymentLinkId, fetchFn);
