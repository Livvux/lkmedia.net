import { z } from "astro/zod";
import { parse } from "yaml";

export const PRODUKTE = ["docweb", "handwerkweb", "fahrschulweb"] as const;
export type Produkt = (typeof PRODUKTE)[number];

/** https-Origin ohne Pfad/Slash (http nur für localhost). */
const origin = z.string().refine(
  (o) => {
    try {
      const u = new URL(o);
      const ok = u.protocol === "https:" || (u.protocol === "http:" && u.hostname === "localhost");
      return ok && u.origin === o;
    } catch {
      return false;
    }
  },
  { message: "Origin ohne Pfad/Slash, z. B. https://beispiel.de" },
);

export const kundeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  produkt: z.enum(PRODUKTE),
  name: z.string().min(1),
  status: z.enum(["onboarding", "vorschau", "live", "gekuendigt"]),
  stripe: z.object({
    session: z.string(),
    kunde: z.string().optional(),
    email: z.email(),
  }),
  repo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional(),
  vorschau: z.string().optional(),
  domain: z.string().optional(),
  formulare: z
    .object({
      email: z.email(),
      origins: z.array(origin),
      plzPraefixe: z.array(z.string().regex(/^\d{1,5}$/)),
    })
    .optional(),
  geprueft: z.string().optional(),
});
export type Kunde = z.infer<typeof kundeSchema>;

/** `defekt`: ganze Datei unlesbar (kein YAML / keine Liste). Ungültige Einträge landen in `fehler` (ohne Personendaten), gültige bleiben. */
export function parseKunden(text: string): { kunden: Kunde[]; fehler: string[]; defekt?: true } {
  let doc: unknown;
  try {
    doc = parse(text);
  } catch {
    return { kunden: [], fehler: ["kunden.yaml ist kein gültiges YAML"], defekt: true };
  }
  if (doc == null) return { kunden: [], fehler: [] };
  if (!Array.isArray(doc))
    return { kunden: [], fehler: ["kunden.yaml ist keine Liste"], defekt: true };
  const kunden: Kunde[] = [];
  const fehler: string[] = [];
  doc.forEach((eintrag, i) => {
    const r = kundeSchema.safeParse(eintrag);
    if (r.success) {
      kunden.push(r.data);
      return;
    }
    const id = typeof eintrag?.id === "string" ? eintrag.id : `#${i}`;
    // Nur Enum-Felder mit Wert nennen (keine Personendaten im Log).
    const felder = r.error.issues
      .map((x) => {
        const k = x.path[0];
        const wert = k === "produkt" || k === "status" ? ` (${JSON.stringify(eintrag[k])})` : "";
        return `${x.path.join(".")}${wert}: ${x.message}`;
      })
      .join("; ");
    fehler.push(`Eintrag ${id}: ${felder}`);
  });
  return { kunden, fehler };
}
