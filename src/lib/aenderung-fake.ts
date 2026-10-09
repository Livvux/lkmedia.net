// Nur für e2e: astro dev mit PIPELINE_FAKE=1 (siehe aenderungDeps). Jede Session bekommt einen
// eigenen In-Memory-GitHub mit einem Auftrag im Status „Rückfrage“ – Tests stören sich nicht.
import type { AenderungDeps } from "./aenderung-submit";
import type { GitHub, Issue } from "./github";
import type { Kunde } from "./kunden";
import { LABELS, sessionHash } from "./pipeline";

const REPO = "Livvux/fahrschule-test";
export const FAKE_FRAGE = "Sollen die neuen Preise nur für Klasse B gelten oder für alle Klassen?";

function memoryGitHub(): GitHub {
  const issues = new Map<string, Issue[]>();
  const comments = new Map<string, { body: string; createdAt: string }[]>();
  const list = (repo: string) => issues.get(repo) ?? issues.set(repo, []).get(repo) ?? [];
  const find = (repo: string, nr: number) => {
    const i = list(repo).find((x) => x.number === nr);
    if (!i) throw new Error("Issue fehlt");
    return i;
  };
  return {
    commitFiles: async () => ({ sha: "fake" }),
    createIssue: async (repo, o) => {
      const number = list(repo).length + 1;
      const url = `https://github.com/${repo}/issues/${number}`;
      list(repo).push({
        number,
        title: o.title,
        body: o.body,
        state: "open",
        labels: [...o.labels],
        createdAt: new Date().toISOString(),
        closedAt: null,
        url,
      });
      return { number, url };
    },
    updateIssue: async (repo, nr, o) => {
      Object.assign(find(repo, nr), o);
    },
    comment: async (repo, nr, body) => {
      find(repo, nr);
      const k = `${repo}#${nr}`;
      comments.set(k, [...(comments.get(k) ?? []), { body, createdAt: new Date().toISOString() }]);
    },
    listIssues: async (repo, o = {}) =>
      list(repo)
        .filter((i) => o.state === "all" || i.state === (o.state ?? "open"))
        .filter((i) => (o.labels ?? []).every((l) => i.labels.includes(l)))
        .map((i) => ({ ...i, labels: [...i.labels] })),
    listComments: async (repo, nr) => [...(comments.get(`${repo}#${nr}`) ?? [])],
    removeLabel: async (repo, nr, label) => {
      const i = find(repo, nr);
      i.labels = i.labels.filter((l) => l !== label);
    },
  };
}

const sessions = new Map<string, Promise<GitHub>>();

async function seed(sessionId: string): Promise<GitHub> {
  const gh = memoryGitHub();
  const { number } = await gh.createIssue(REPO, {
    title: "Änderung: Preise",
    body: `Preise anpassen\n\nsession:${await sessionHash(sessionId)}`,
    labels: [LABELS.aenderung, "kat:preise", LABELS.rueckfrage],
  });
  await gh.comment(REPO, number, `@kunde: ${FAKE_FRAGE}`);
  return gh;
}

export async function fakeDeps(sessionId: string): Promise<AenderungDeps> {
  if (!sessions.has(sessionId)) sessions.set(sessionId, seed(sessionId));
  const gh = await (sessions.get(sessionId) as Promise<GitHub>);
  const kunde: Kunde = {
    id: "fahrschule-test",
    produkt: "fahrschulweb",
    name: "Fahrschule Test",
    status: "live",
    stripe: { session: sessionId, email: "test@example.test" },
    repo: REPO,
  };
  return {
    stripeKey: "sk_fake",
    checkAnySession: async () => ({ paid: true, produkt: "fahrschulweb" }),
    registry: { all: async () => [kunde], bySession: async () => kunde },
    gh,
    send: async () => {},
  };
}
