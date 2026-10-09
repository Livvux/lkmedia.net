import { describe, expect, it, vi } from "vitest";
import { createRegistry, DEMO_KUNDEN, DEV_ORIGINS, allowedOrigins } from "../../src/lib/kunden";
import { kundeSchema, parseKunden } from "../../src/lib/kunden-schema";

const GUT = `- id: patricks-fahrschule
  produkt: fahrschulweb
  name: Patricks Fahrschule
  status: live
  stripe: { session: cs_test_x, kunde: cus_1, email: p@example.de }
  formulare: { email: info@example.de, origins: [https://example.de], plzPraefixe: [] }
  geprueft: 2026-10-09
`;
const SCHLECHT = `- id: tippfehler
  produkt: fahrschule
  name: X
  status: live
  stripe: { session: cs_test_y, email: a@b.de }
`;
const URL = "https://api.github.com/repos/Livvux/kunden/contents/kunden.yaml";

const mkFetch = (...antworten: Array<string | number>) => {
  const fn = vi.fn(async () => {
    const a = antworten.length > 1 ? antworten.shift() : antworten[0];
    return typeof a === "number"
      ? new Response("x", { status: a })
      : new Response(a as string, { status: 200 });
  });
  return fn;
};

describe("parseKunden", () => {
  it("behält gültige Einträge, meldet den ungültigen", () => {
    const r = parseKunden(`${GUT}${SCHLECHT}`);
    expect(r.kunden).toHaveLength(1);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toContain("fahrschule");
    expect(r.fehler[0]).toContain("tippfehler");
  });
  it("leer und [] sind gültig", () => {
    expect(parseKunden("")).toEqual({ kunden: [], fehler: [] });
    expect(parseKunden("[]")).toEqual({ kunden: [], fehler: [] });
  });
  it("Nicht-Liste → ein Fehler", () => {
    expect(parseKunden("a: 1").fehler).toHaveLength(1);
    expect(parseKunden("a: [").fehler).toHaveLength(1);
  });
});

describe("parseKunden Strenge", () => {
  const mit = (alt: string, neu: string) => parseKunden(GUT.replace(alt, neu));
  it("Origin mit Slash → verworfen mit Meldung", () => {
    const r = mit("https://example.de]", "https://x.de/]");
    expect(r.kunden).toHaveLength(0);
    expect(r.fehler[0]).toContain("Origin ohne Pfad/Slash, z. B. https://beispiel.de");
  });
  it("javascript:x und http (nicht localhost) → verworfen", () => {
    expect(mit("https://example.de]", "javascript:x]").kunden).toHaveLength(0);
    expect(mit("https://example.de]", "http://example.de]").kunden).toHaveLength(0);
  });
  it("http://localhost:4321 ist erlaubt", () =>
    expect(mit("https://example.de]", "http://localhost:4321]").kunden).toHaveLength(1));
  it("E-Mail info@ → verworfen (formulare und stripe)", () => {
    expect(mit("info@example.de", "info@").kunden).toHaveLength(0);
    expect(mit("p@example.de", "p@").kunden).toHaveLength(0);
  });
  it("plzPraefixe, id, repo streng", () => {
    expect(mit("plzPraefixe: []", "plzPraefixe: [abc]").kunden).toHaveLength(0);
    expect(mit("plzPraefixe: []", "plzPraefixe: ['762']").kunden).toHaveLength(1);
    expect(mit("id: patricks-fahrschule", "id: Patrick_X").kunden).toHaveLength(0);
    expect(mit("  geprueft", "  repo: Livvux/a b\n  geprueft").kunden).toHaveLength(0);
    expect(mit("  geprueft", "  repo: Livvux/site\n  geprueft").kunden).toHaveLength(1);
  });
  it("DEMO_KUNDEN bleiben gültig", () => {
    for (const k of DEMO_KUNDEN) expect(kundeSchema.safeParse(k).success).toBe(true);
  });
});

describe("createRegistry", () => {
  it("cached 5 Minuten, ruft danach neu ab, sendet Header", async () => {
    const f = mkFetch(GUT);
    let t = 1000;
    const r = createRegistry({ token: "t", fetchFn: f as never, now: () => t });
    await r.all();
    await r.all();
    expect(f).toHaveBeenCalledTimes(1);
    const [u, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(u).toBe(URL);
    expect(init.headers).toMatchObject({
      Authorization: "Bearer t",
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    });
    t += 300_001;
    await r.all();
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("Fehler beim Nachladen → alter Stand", async () => {
    const f = mkFetch(GUT, 500);
    let t = 0;
    const r = createRegistry({ token: "t", fetchFn: f as never, now: () => t });
    await r.all();
    t += 300_001;
    const all = await r.all();
    expect(all?.some((k) => k.id === "patricks-fahrschule")).toBe(true);
  });
  it("ohne Token nur Demos", async () => {
    const f = mkFetch(GUT);
    const r = createRegistry({ fetchFn: f as never });
    expect(await r.all()).toEqual(DEMO_KUNDEN);
    expect((await r.bySiteId("demo"))?.produkt).toBe("handwerkweb");
    expect(f).not.toHaveBeenCalled();
  });
  it("Token, erster Abruf 500 → all() null, Demos per bySiteId trotzdem", async () => {
    const r = createRegistry({ token: "t", fetchFn: mkFetch(500) as never });
    expect(await r.all()).toBeNull();
    expect((await r.bySiteId("fahrschule-demo"))?.produkt).toBe("fahrschulweb");
  });
  it("bySession findet Session, leere nie", async () => {
    const r = createRegistry({ token: "t", fetchFn: mkFetch(GUT) as never });
    expect((await r.bySession("cs_test_x"))?.id).toBe("patricks-fahrschule");
    expect(await r.bySession("")).toBeUndefined();
  });
  it("ein ungültiger Eintrag lässt die anderen leben", async () => {
    const r = createRegistry({ token: "t", fetchFn: mkFetch(`${SCHLECHT}${GUT}`) as never });
    expect((await r.bySiteId("patricks-fahrschule"))?.name).toBe("Patricks Fahrschule");
    expect(await r.bySiteId("tippfehler")).toBeUndefined();
  });
});

describe("createRegistry Ausfälle", () => {
  const alt = (all: Array<{ id: string }> | null) => all?.some((k) => k.id === "patricks-fahrschule");

  it.each(["a: 1", "a: ["])("kaputte Datei (%s) behält alten Stand", async (kaputt) => {
    const f = mkFetch(GUT, kaputt);
    let t = 0;
    const r = createRegistry({ token: "t", fetchFn: f as never, now: () => t });
    await r.all();
    t += 300_001;
    expect(alt(await r.all())).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("Backoff 60 s nach Fehlschlag", async () => {
    const f = mkFetch(GUT, 500, GUT);
    let t = 0;
    const r = createRegistry({ token: "t", fetchFn: f as never, now: () => t });
    await r.all();
    t += 300_001;
    await r.all();
    t += 59_000;
    await r.all();
    expect(f).toHaveBeenCalledTimes(2);
    t += 1_001;
    await r.all();
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("Netzwerkfehler (reject) fällt auf alten Stand zurück", async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response(GUT)).mockRejectedValue(new Error("net"));
    let t = 0;
    const r = createRegistry({ token: "t", fetchFn: f as never, now: () => t });
    await r.all();
    t += 300_001;
    expect(alt(await r.all())).toBe(true);
  });
  it("parallele all() → ein fetch", async () => {
    const f = mkFetch(GUT);
    const r = createRegistry({ token: "t", fetchFn: f as never });
    await Promise.all([r.all(), r.all(), r.bySiteId("demo")]);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe("allowedOrigins", () => {
  it("dev hängt DEV_ORIGINS an", () => {
    const k = DEMO_KUNDEN[0];
    expect(allowedOrigins(k, true)).toEqual([...(k.formulare?.origins ?? []), ...DEV_ORIGINS]);
    expect(allowedOrigins(k, false)).toEqual(k.formulare?.origins);
  });
});
