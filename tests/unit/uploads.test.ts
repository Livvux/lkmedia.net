import { describe, expect, it } from "vitest";
import { detectType, isSafeSvg, readUploads, slugName, UPLOAD_LIMITS } from "../../src/lib/uploads";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
const JPG = [0xff, 0xd8, 0xff, 0xe0, 0, 1];
const WEBP = [..."RIFF"].map((c) => c.charCodeAt(0)).concat([1, 2, 3, 4], [..."WEBP"].map((c) => c.charCodeAt(0)));
const enc = (s: string) => new TextEncoder().encode(s);
const file = (data: BlobPart, name: string) => new File([data], name);
const form = (...files: File[]) => {
  const f = new FormData();
  for (const x of files) f.append("bilder", x);
  return f;
};
const OK_SVG = '<?xml version="1.0"?>\n<!-- c -->\n<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';

describe("detectType", () => {
  it("erkennt Typen per Magic Bytes", () => {
    expect(detectType(new Uint8Array(JPG))).toBe("jpg");
    expect(detectType(new Uint8Array(PNG))).toBe("png");
    expect(detectType(new Uint8Array(WEBP))).toBe("webp");
    expect(detectType(enc(OK_SVG))).toBe("svg");
    expect(detectType(enc(`﻿  <svg></svg>`))).toBe("svg");
    expect(detectType(enc('<!DOCTYPE svg><svg/>'))).toBe("svg");
  });
  it("lehnt HEIC, PDF und HTML ab", () => {
    expect(detectType(enc("\0\0\0\x18ftypheic"))).toBeNull();
    expect(detectType(enc("%PDF-1.4"))).toBeNull();
    expect(detectType(enc("<html><svg></svg></html>"))).toBeNull();
  });
});

describe("isSafeSvg", () => {
  it("lässt harmloses SVG zu", () => expect(isSafeSvg(OK_SVG)).toBe(true));
  it.each([
    "<svg><script>x</script></svg>",
    "<svg><SCRIPT>x</SCRIPT></svg>",
    '<svg onload="x()"/>',
    '<svg ONLOAD = "x()"/>',
    '<svg><a href="javascript:x()"/></svg>',
    "<svg><foreignObject/></svg>",
    '<svg><image href="https://x/a.png"/></svg>',
    '<svg><image xlink:href="//x/a.png"/></svg>',
    '<!DOCTYPE svg [<!ENTITY a "b">]><svg/>',
    '<svg><use href="other.svg#a"/></svg>',
    "<svg><!-- --><script/></svg>",
  ])("lehnt ab: %s", (s) => expect(isSafeSvg(s)).toBe(false));
  it("erlaubt interne use-Referenz", () =>
    expect(isSafeSvg('<svg><use href="#a"/></svg>')).toBe(true));
  it("ignoriert Kommentare nicht als Versteck", () =>
    expect(isSafeSvg("<svg><!-- <script> --></svg>")).toBe(true));
});

describe("slugName", () => {
  it("bereinigt Namen", () => {
    expect(slugName("Fahrschul Büro (1).JPG", "jpg")).toBe("fahrschul-buero-1.jpg");
    expect(slugName("Straße.png", "png")).toBe("strasse.png");
    expect(slugName("###.png", "png")).toBe("bild.png");
    expect(slugName(`${"a".repeat(60)}.png`, "png")).toBe(`${"a".repeat(40)}.png`);
  });
});

describe("readUploads", () => {
  it("nimmt Typ aus Magic Bytes, nicht aus Endung", async () => {
    const r = await readUploads(form(file(new Uint8Array(PNG), "foto.jpg")), "bilder", { max: 5 });
    expect(r).toMatchObject({ ok: true, files: [{ name: "foto.png", ext: "png" }] });
  });
  it("vergibt Suffixe bei doppelten Namen, ignoriert leere", async () => {
    const r = await readUploads(
      form(file(new Uint8Array(PNG), "logo.png"), file(new Uint8Array(PNG), "logo.png"), file("", "")),
      "bilder",
      { max: 5 },
    );
    expect(r.ok && r.files.map((f) => f.name)).toEqual(["logo.png", "logo-2.png"]);
  });
  it("lehnt HEIC und PDF ab", async () => {
    for (const [d, n] of [["\0\0\0\x18ftypheic", "a.heic"], ["%PDF-1.4", "b.png"]] as const) {
      const r = await readUploads(form(file(d, n)), "bilder", { max: 5 });
      expect(r).toEqual({
        ok: false,
        fehler: `„${n}“ ist kein unterstütztes Bild. Möglich sind JPG, PNG, WebP und SVG.`,
      });
    }
  });
  it("lehnt unsicheres SVG ab", async () => {
    const r = await readUploads(form(file("<svg><script/></svg>", "x.svg")), "bilder", { max: 5 });
    expect(r).toEqual({
      ok: false,
      fehler: "„x.svg“ enthält Code und kann aus Sicherheitsgründen nicht verwendet werden.",
    });
  });
  it("begrenzt Anzahl", async () => {
    const f = Array.from({ length: 6 }, (_, i) => file(new Uint8Array(PNG), `${i}.png`));
    expect(await readUploads(form(...f), "bilder", { max: 5 })).toEqual({
      ok: false,
      fehler: "Bitte höchstens 5 Bilder auswählen.",
    });
  });
  it("begrenzt Dateigröße auf 8 MB", async () => {
    const big = new Uint8Array(UPLOAD_LIMITS.dateiBytes + 1);
    big.set(PNG);
    expect(await readUploads(form(file(big, "gross.png")), "bilder", { max: 5 })).toEqual({
      ok: false,
      fehler: "„gross.png“ ist größer als 8 MB. Bitte ein kleineres Bild wählen.",
    });
  });
});
