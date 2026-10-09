// handwerkweb – Website-Paket für Handwerksbetriebe (Produktseite /handwerk, Onboarding nach Stripe-Checkout).
import { checkPaidSession, SESSION_ID } from "./stripe";

export const HANDWERKWEB = {
  setupPrice: "1.990 €",
  monthlyPrice: "69 €",
  deliveryPromise:
    "Sobald Ihre Angaben und die benötigten Bilder vollständig vorliegen, erhalten Sie in der Regel innerhalb von 7 Werktagen eine Vorschau. Wir veröffentlichen Ihre Website nach Ihrer Freigabe.",
  demoUrl: "https://handwerk.lkmedia.net",
  // Stripe Payment Link (öffentlich, kein Secret). Leer = noch nicht eingerichtet → CTA führt zum Gespräch.
  // Success-URL beim Anlegen: https://lkmedia.net/handwerk/onboarding?session_id={CHECKOUT_SESSION_ID}
  paymentLink: "https://buy.stripe.com/7sY6oIg6qfutcpme2yeAg0q",
  paymentLinkId: "plink_1UOdXSJ3L2AI7fPZmGbIbumt",
} as const;

const GEWERKE = ["shk", "elektro"] as const;
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;

export interface Onboarding {
  sessionId: string;
  wunschdomain: string;
  betrieb: {
    name: string;
    gewerke: (typeof GEWERKE)[number][];
    meisterbetrieb: boolean;
    telefon: string;
    email: string;
    notdienst: string;
    wunschfarbe: string;
  };
  standort: { strasse: string; plz: string; ort: string; oeffnungszeiten: string };
  einsatzgebiet: string;
  leistungen: string;
  referenzen: string;
  stellen: string;
  team: string;
  recht: {
    inhaber: string;
    rechtsform: string;
    handwerkskammer: string;
    register: string;
    ustId: string;
    haftpflicht: string;
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

  const name = required("betrieb_name", "Betriebsname");
  const gewerke = f
    .getAll("gewerke")
    .flatMap((v) => String(v).split(","))
    .map((g) => g.trim())
    .filter((g, i, a) => a.indexOf(g) === i)
    .filter((g): g is (typeof GEWERKE)[number] => (GEWERKE as readonly string[]).includes(g));
  if (!gewerke.length) errors.push("Mindestens ein Gewerk wählen");
  const telefon = required("telefon", "Telefon", 40);
  const email = required("email", "E-Mail", 120);
  if (email && !EMAIL.test(email)) errors.push("E-Mail ungültig");
  // Erst prüfen, dann speichern: Abschneiden vor der Prüfung ließe "761234" durchgehen.
  const wunschfarbe = str(f, "wunschfarbe", 100);
  if (wunschfarbe && !/^#[0-9a-fA-F]{6}$/.test(wunschfarbe)) errors.push("Wunschfarbe ungültig");
  const plz = required("plz", "PLZ", 100);
  if (plz && !/^\d{5}$/.test(plz)) errors.push("PLZ muss fünfstellig sein");

  const data: Onboarding = {
    sessionId,
    wunschdomain: str(f, "wunschdomain", 120),
    betrieb: {
      name,
      gewerke,
      meisterbetrieb: str(f, "meisterbetrieb") === "ja",
      telefon,
      email,
      notdienst: str(f, "notdienst", 300),
      wunschfarbe,
    },
    standort: {
      strasse: required("strasse", "Straße"),
      plz,
      ort: required("ort", "Ort"),
      oeffnungszeiten: required("oeffnungszeiten", "Öffnungszeiten", 2000),
    },
    einsatzgebiet: required("einsatzgebiet", "Einsatzgebiet", 2000),
    leistungen: required("leistungen", "Leistungen", 5000),
    referenzen: str(f, "referenzen", 5000),
    stellen: str(f, "stellen", 3000),
    team: str(f, "team", 3000),
    recht: {
      inhaber: required("inhaber", "Inhaber / Geschäftsführung"),
      rechtsform: str(f, "rechtsform", 100),
      handwerkskammer: required("handwerkskammer", "Handwerkskammer"),
      register: str(f, "register"),
      ustId: str(f, "ust_id", 40),
      haftpflicht: str(f, "haftpflicht", 300),
    },
    hinweise: str(f, "hinweise", 3000),
  };

  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// JSON ist gültiges YAML – JSON.stringify quotet jeden Wert sicher (":", "#", Zeilenumbrüche …).
const q = (v: string) => JSON.stringify(v);

/** Erzeugt kunde.yaml im Format von handwerkweb/onboarding/kunde.example.yaml. */
export function toKundeYaml(d: Onboarding, o: { datum: string; sessionHash: string }): string {
  const b = d.betrieb;
  return `# handwerkweb Onboarding – an den Agent übergeben (siehe handwerkweb/AGENTS.md)
bestellung:
  stripe_session_hash: ${q(o.sessionHash)}
  datum: ${q(o.datum)}
  wunschdomain: ${q(d.wunschdomain)}

betrieb:
  name: ${q(b.name)}
  gewerke: ${JSON.stringify(b.gewerke)}
  meisterbetrieb: ${b.meisterbetrieb}
  telefon: ${q(b.telefon)}
  email: ${q(b.email)}
  notdienst: ${q(b.notdienst)}
  wunschfarbe: ${q(b.wunschfarbe)}

standort:
  strasse: ${q(d.standort.strasse)}
  plz: ${q(d.standort.plz)}
  ort: ${q(d.standort.ort)}
  oeffnungszeiten: ${q(d.standort.oeffnungszeiten)}

einsatzgebiet: ${q(d.einsatzgebiet)}
leistungen: ${q(d.leistungen)}
referenzen: ${q(d.referenzen)}
stellen: ${q(d.stellen)}
team: ${q(d.team)}

recht:
  inhaber: ${q(d.recht.inhaber)}
  rechtsform: ${q(d.recht.rechtsform)}
  handwerkskammer: ${q(d.recht.handwerkskammer)}
  register: ${q(d.recht.register)}
  ust_id: ${q(d.recht.ustId)}
  haftpflicht: ${q(d.recht.haftpflicht)}

hinweise: ${q(d.hinweise)}
`;
}

export const checkSession = (id: string, secretKey: string, fetchFn: typeof fetch = fetch) =>
  checkPaidSession(id, secretKey, HANDWERKWEB.paymentLinkId, fetchFn);
