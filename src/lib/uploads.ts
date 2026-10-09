// Bildprüfung für Pipeline-Uploads (Onboarding, /aenderung). Typ nur per Magic Bytes.
export type Upload = { name: string; ext: "jpg" | "png" | "webp" | "svg"; bytes: Uint8Array };

export const UPLOAD_LIMITS = { dateiBytes: 8 * 1024 * 1024, gesamtBytes: 40 * 1024 * 1024 };

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const SVG_HEAD = /^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>)*<svg[\s>/]/i;

export function detectType(b: Uint8Array): Upload["ext"] | null {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  // ponytail: nur die ersten 4 KB; ein längerer Prolog/Doctype wird als "kein Bild" abgelehnt
  const head = new TextDecoder().decode(b.subarray(0, 4096)).replace(/^﻿/, "");
  return SVG_HEAD.test(head) ? "svg" : null;
}

// Vertrag mit fahrschulweb validate (svg-check.ts): dieselben Regeln, bei Änderung beide anpassen.
// ponytail: Denylist über Text; Abwehr in der Tiefe: Templates liefern *.svg mit CSP sandbox aus.
// Upgrade: XML-Parser + Allowlist.
// Rohtext, case-insensitiv, KEIN Kommentar-Strippen (CDATA/Kommentar-Tricks); <script in
// Kommentaren ist ein bewusster False Positive. Jede &-Referenz außer den 5 Standard-Entities
// (inkl. &#...) wird abgelehnt, damit href/javascript: nicht kodiert versteckt werden kann.
const PFX = "(?:[^\\s<>/:!?]+:)?"; // beliebiger XML-Präfix (auch mit . oder Nicht-ASCII)
const ATTRS = `(?:"[^"]*"|'[^']*'|[^>"'])*?`; // Attribute, '>' in Werten beachten
const UNSAFE_SVG = [
  new RegExp(`<${PFX}(?:script|foreignObject|iframe|embed|object|handler|listener)\\b`, "i"),
  new RegExp(`<${PFX}use\\b${ATTRS}href\\s*=(?!\\s*["']?\\s*#)`, "i"),
  /[\s"'/]on\w+\s*=/i,
  /href\s*=\s*["']?\s*(?:https?:|\/\/)/i,
  /<!ENTITY/i,
  /<\?xml-stylesheet/i,
  /www\.w3\.org\/1999\/XSL\/Transform/i,
  /<xsl:/i,
  /<!DOCTYPE[^>]*\[/i,
  /&(?!(?:amp|lt|gt|quot|apos);)/,
];
// Schemata auch mit eingestreutem Whitespace (java\nscript:) erkennen; data: nur für Raster-Bilder.
const UNSAFE_SCHEME = /javascript:|vbscript:|(?<![\w-])data:(?!image\/(?:png|jpeg|gif|webp)[;,])/i;

export function isSafeSvg(text: string): boolean {
  return !UNSAFE_SVG.some((re) => re.test(text)) && !UNSAFE_SCHEME.test(text.replace(/\s+/g, ""));
}

export function slugName(original: string, ext: Upload["ext"]): string {
  const base = original.replace(/\.[^.]*$/, "");
  const slug = base
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return `${slug || "bild"}.${ext}`;
}

export async function readUploads(
  form: FormData,
  field: string,
  o: { max: number; maxBytes?: number },
): Promise<{ ok: true; files: Upload[] } | { ok: false; fehler: string }> {
  const maxBytes = o.maxBytes ?? UPLOAD_LIMITS.dateiBytes;
  const entries = form.getAll(field).filter((v): v is File => typeof v !== "string" && v.size > 0);
  if (entries.length > o.max)
    return { ok: false, fehler: `Bitte höchstens ${o.max} Bilder auswählen.` };
  const files: Upload[] = [];
  const used = new Set<string>();
  for (const f of entries) {
    if (f.size > maxBytes) {
      return {
        ok: false,
        fehler: `„${f.name}“ ist größer als 8 MB. Bitte ein kleineres Bild wählen.`,
      };
    }
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = detectType(bytes);
    if (!ext) {
      return {
        ok: false,
        fehler: `„${f.name}“ ist kein unterstütztes Bild. Möglich sind JPG, PNG, WebP und SVG.`,
      };
    }
    if (ext === "svg" && !isSafeSvg(new TextDecoder().decode(bytes))) {
      return {
        ok: false,
        fehler: `„${f.name}“ enthält Code und kann aus Sicherheitsgründen nicht verwendet werden.`,
      };
    }
    const first = slugName(f.name, ext);
    let name = first;
    for (let n = 2; used.has(name); n++) name = first.replace(/(\.\w+)$/, `-${n}$1`);
    used.add(name);
    files.push({ name, ext, bytes });
  }
  return { ok: true, files };
}
