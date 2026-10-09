import type { GitHub, Issue } from "../../../src/lib/github";

// In-Memory-GitHub für Unit-Tests. Zustand ist offen inspizierbar; einzelne Methoden lassen sich
// für Fehlerfälle überschreiben (`fake.gh.createIssue = async () => { throw … }`).
export type FakeCommit = {
  repo: string;
  branch: string;
  base?: string;
  message: string;
  paths: string[];
};

export function createGitHubFake() {
  const issues = new Map<string, Issue[]>();
  const comments = new Map<string, { body: string; createdAt: string }[]>();
  const commits: FakeCommit[] = [];
  const removedLabels: { repo: string; nr: number; label: string }[] = [];
  let tick = 0;
  const stamp = () => new Date(Date.UTC(2026, 9, 1) + tick++ * 60_000).toISOString();
  const key = (repo: string, nr: number) => `${repo}#${nr}`;
  const repoIssues = (repo: string) => {
    if (!issues.has(repo)) issues.set(repo, []);
    return issues.get(repo) as Issue[];
  };
  const find = (repo: string, nr: number) => {
    const i = repoIssues(repo).find((x) => x.number === nr);
    if (!i) throw new Error(`Fake: Issue ${key(repo, nr)} fehlt`);
    return i;
  };

  /** Issue direkt anlegen (Seed für Tests). */
  const addIssue = (repo: string, o: Partial<Issue> = {}): Issue => {
    const list = repoIssues(repo);
    const number = o.number ?? list.length + 1;
    const issue: Issue = {
      number,
      title: "t",
      body: "",
      state: "open",
      labels: [],
      createdAt: stamp(),
      closedAt: null,
      url: `https://github.com/${repo}/issues/${number}`,
      ...o,
    };
    list.push(issue);
    return issue;
  };
  const addComment = (repo: string, nr: number, body: string) => {
    const k = key(repo, nr);
    comments.set(k, [...(comments.get(k) ?? []), { body, createdAt: stamp() }]);
  };

  const gh: GitHub = {
    commitFiles: async (repo, o) => {
      commits.push({
        repo,
        branch: o.branch,
        base: o.base,
        message: o.message,
        paths: o.files.map((f) => f.path),
      });
      return { sha: `sha${commits.length}` };
    },
    createIssue: async (repo, o) => {
      const i = addIssue(repo, { title: o.title, body: o.body, labels: [...o.labels] });
      return { number: i.number, url: i.url };
    },
    updateIssue: async (repo, nr, o) => {
      const i = find(repo, nr);
      if (o.body !== undefined) i.body = o.body;
      if (o.labels) i.labels = [...o.labels];
      if (o.state) i.state = o.state;
    },
    comment: async (repo, nr, body) => {
      find(repo, nr);
      addComment(repo, nr, body);
    },
    listIssues: async (repo, o = {}) =>
      repoIssues(repo)
        .filter((i) => (o.state ?? "open") === "all" || i.state === (o.state ?? "open"))
        .filter((i) => (o.labels ?? []).every((l) => i.labels.includes(l)))
        .map((i) => ({ ...i, labels: [...i.labels] })),
    listComments: async (repo, nr) => [...(comments.get(key(repo, nr)) ?? [])],
    removeLabel: async (repo, nr, label) => {
      const i = find(repo, nr);
      i.labels = i.labels.filter((l) => l !== label);
      removedLabels.push({ repo, nr, label });
    },
  };

  const commentsOf = (repo: string, nr: number) => comments.get(key(repo, nr)) ?? [];
  return { gh, issues, comments, commits, removedLabels, addIssue, addComment, commentsOf };
}
