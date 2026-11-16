// Deterministische Vorlagen für die Showcase-Simulation: keine KI, kein Netzwerk.
export type Lang = "de" | "en";
export type Tone = "factual" | "friendly" | "expert";

export interface Brief {
  topic: string;
  audience: string;
  tone: Tone;
  points: [string, string, string];
}

export interface Draft {
  h1: string;
  meta: string;
  outline: string[];
  intro: string;
  questions: string[];
}

export const LIMITS = { topic: 90, audience: 60, point: 70 } as const;
export const META_MAX = 160;

export const TONES: Record<Lang, { value: Tone; label: string }[]> = {
  de: [
    { value: "factual", label: "Sachlich" },
    { value: "friendly", label: "Nahbar" },
    { value: "expert", label: "Fachlich" },
  ],
  en: [
    { value: "factual", label: "Factual" },
    { value: "friendly", label: "Approachable" },
    { value: "expert", label: "Expert" },
  ],
};

export function defaultBrief(lang: Lang): Brief {
  return lang === "de"
    ? {
        topic: "Förderung für Wärmepumpen im Bestand",
        audience: "Eigentümer von Einfamilienhäusern",
        tone: "friendly",
        points: [
          "Passende Förderprogramme",
          "Ablauf vom Antrag bis zur Auszahlung",
          "Aufgaben des Fachbetriebs",
        ],
      }
    : {
        topic: "Heat pump subsidies for existing homes",
        audience: "Owners of single-family homes",
        tone: "friendly",
        points: [
          "Subsidy programmes that may apply",
          "Steps from application to payout",
          "What the installer takes care of",
        ],
      };
}

/** Alles ist reiner Text: Leerraum zusammenfassen, kürzen. React escaped bei der Ausgabe. */
export function clean(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max).trim();
}

function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.:;–-]+$/, "")}…`;
}

// Zielgruppen-Satz nur anhängen, wenn er noch in 160 Zeichen passt.
function metaFor(core: string, suffix: string): string {
  return core.length + suffix.length <= META_MAX ? core + suffix : shorten(core, META_MAX);
}

const upper = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
// Englisch im Satz klein beginnen; Abkürzungen („SEO“) und deutsche Nomen bleiben unverändert.
const lower = (s: string) =>
  /^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;

export function buildDraft(brief: Brief, lang: Lang): Draft {
  const de = lang === "de";
  const topic = clean(brief.topic, LIMITS.topic) || (de ? "[Thema]" : "[Topic]");
  const audience = clean(brief.audience, LIMITS.audience) || (de ? "[Zielgruppe]" : "[Audience]");
  const points = brief.points.map(
    (p, i) => clean(p, LIMITS.point) || (de ? `[Kernpunkt ${i + 1}]` : `[Key point ${i + 1}]`),
  );
  const inline = (s: string) => (de ? s : lower(s));
  const [p1, p2, p3] = points.map(inline);
  const who = inline(audience);

  const intro = de
    ? {
        factual: `Dieser Beitrag fasst für ${who} zusammen, was beim Thema „${topic}“ zählt: ${p1}, ${p2} und ${p3}.`,
        friendly: `Sie überlegen, sich mit „${topic}“ zu beschäftigen? Hier finden ${who} die wichtigsten Antworten, Schritt für Schritt: ${p1}, ${p2} und ${p3}.`,
        expert: `„${topic}“ im Detail für ${who}: Wir ordnen ein, worauf es fachlich ankommt – ${p1}, ${p2} und ${p3}.`,
      }
    : {
        factual: `This article sums up what matters about "${topic}" for ${who}: ${p1}, ${p2} and ${p3}.`,
        friendly: `Thinking about "${topic}"? Here, ${who} find the key answers step by step: ${p1}, ${p2} and ${p3}.`,
        expert: `"${topic}" in detail for ${who}: what matters technically – ${p1}, ${p2} and ${p3}.`,
      };

  return {
    h1: de ? `${upper(topic)}: ein Überblick für ${who}` : `${upper(topic)}: a guide for ${who}`,
    meta: metaFor(
      de ? `${upper(topic)}: ${p1}, ${p2} und ${p3}.` : `${upper(topic)}: ${p1}, ${p2} and ${p3}.`,
      de ? ` Kompakt erklärt für ${who}.` : ` Explained for ${who}.`,
    ),
    outline: [...points.map(upper), de ? "Ihr nächster Schritt" : "Your next step"],
    intro: intro[brief.tone],
    questions: [
      ...points
        .map(inline)
        .map((p) =>
          de
            ? `Aussagen zu „${p}“ mit aktueller Quelle belegen`
            : `Back up claims on "${p}" with a current source`,
        ),
      de
        ? "Zahlen, Fristen und Beträge gegen die Originalquelle prüfen"
        : "Check figures, deadlines and amounts against the original source",
      de ? `Ton und Ansprache für ${who} freigeben` : `Approve tone and wording for ${who}`,
    ],
  };
}
