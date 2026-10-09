// Kundenregister: kunden.yaml aus dem privaten Repo Livvux/kunden, 5 min Cache, Stale-Fallback.
import { type Kunde, parseKunden } from "./kunden-schema";

export { type Kunde, kundeSchema, PRODUKTE, type Produkt, parseKunden } from "./kunden-schema";

const RETRY_MS = 60_000;
const URL = "https://api.github.com/repos/Livvux/kunden/contents/kunden.yaml";

export const DEMO_KUNDEN: Kunde[] = [
  {
    id: "demo",
    produkt: "handwerkweb",
    name: "Muster Haustechnik (Demo)",
    status: "live",
    stripe: { session: "", email: "lucas@lkmedia.net" },
    formulare: {
      email: "lucas@lkmedia.net",
      origins: ["https://handwerk.lkmedia.net"],
      plzPraefixe: ["762", "764", "765", "772"],
    },
  },
  {
    id: "fahrschule-demo",
    produkt: "fahrschulweb",
    name: "Muster Fahrschule (Demo)",
    status: "live",
    stripe: { session: "", email: "lucas@lkmedia.net" },
    formulare: {
      email: "lucas@lkmedia.net",
      origins: ["https://fahrschule.lkmedia.net"],
      plzPraefixe: [],
    },
  },
];

/** Template-Dev-Server (astro dev / preview). */
export const DEV_ORIGINS = [
  "http://localhost:4321",
  "http://localhost:4322",
  "http://localhost:4323",
];

export function allowedOrigins(k: Kunde, dev: boolean): string[] {
  const origins = k.formulare?.origins ?? [];
  return dev ? [...origins, ...DEV_ORIGINS] : origins;
}

export type Registry = {
  all(): Promise<Kunde[] | null>;
  bySiteId(id: string): Promise<Kunde | undefined>;
  bySession(sessionId: string): Promise<Kunde | undefined>;
};

export function createRegistry(o: {
  token?: string;
  fetchFn?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
}): Registry {
  const { token, fetchFn = fetch, now = Date.now, ttlMs = 300_000 } = o;
  let stand: Kunde[] | null = null;
  let geladen = 0;
  let nextTry = 0;
  let laufend: Promise<void> | null = null;

  async function laden(): Promise<void> {
    try {
      const res = await fetchFn(URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { kunden, fehler, defekt } = parseKunden(await res.text());
      for (const f of fehler) console.error(`[kunden] ${f}`);
      if (defekt) throw new Error("Datei unlesbar");
      stand = kunden;
      geladen = now();
    } catch (e) {
      nextTry = now() + RETRY_MS;
      console.error("[kunden] Abruf fehlgeschlagen:", e instanceof Error ? e.message : e);
    }
  }

  async function all(): Promise<Kunde[] | null> {
    if (!token) return DEMO_KUNDEN;
    if ((!stand || now() - geladen > ttlMs) && now() >= nextTry) {
      laufend ??= laden().finally(() => {
        laufend = null;
      });
    }
    if (laufend) await laufend;
    return stand ? [...stand, ...DEMO_KUNDEN] : null;
  }

  return {
    all,
    async bySiteId(id) {
      return ((await all()) ?? DEMO_KUNDEN).find((k) => k.id === id);
    },
    async bySession(sessionId) {
      if (!sessionId) return undefined;
      return (await all())?.find((k) => k.stripe.session === sessionId);
    },
  };
}

export const registry = createRegistry({
  token: process.env.GITHUB_KUNDEN_TOKEN ?? import.meta.env.GITHUB_KUNDEN_TOKEN,
});
