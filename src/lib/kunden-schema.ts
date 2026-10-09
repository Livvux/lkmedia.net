import { z } from "astro/zod";
import { parse } from "yaml";

export const PRODUKTE = ["docweb", "handwerkweb", "fahrschulweb"] as const;
export type Produkt = (typeof PRODUKTE)[number];

export const kundeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  produkt: z.enum(PRODUKTE),
  name: z.string().min(1),
  status: z.enum(["onboarding", "vorschau", "live", "gekuendigt"]),
  stripe: z.object({
    session: z.string(),
    kunde: z.string().optional(),
    email: z.string(),
  }),
  repo: z.string().optional(),
  vorschau: z.string().optional(),
  domain: z.string().optional(),
  formulare: z
    .object({
      email: z.string(),
      origins: z.array(z.string()),
      plzPraefixe: z.array(z.string()),
    })
    .optional(),
  geprueft: z.string().optional(),
});
export type Kunde = z.infer<typeof kundeSchema>;

/** Ungültige Einträge landen in `fehler` (ohne Personendaten), gültige bleiben. */
export function parseKunden(text: string): { kunden: Kunde[]; fehler: string[] } {
  let doc: unknown;
  try {
    doc = parse(text);
  } catch {
    return { kunden: [], fehler: ["kunden.yaml ist kein gültiges YAML"] };
  }
  if (doc == null) return { kunden: [], fehler: [] };
  if (!Array.isArray(doc)) return { kunden: [], fehler: ["kunden.yaml ist keine Liste"] };
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
