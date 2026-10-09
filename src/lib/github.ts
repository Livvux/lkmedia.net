// Schlanker GitHub-REST-Client (Commits per Git Data API, Issues) für private Kunden-Repos.
const API = "https://api.github.com";
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const MAX_PAGES = 10;

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    // Bewusst ohne Token, Request- oder Response-Body.
    super(`GitHub ${status} bei ${path}`);
    this.name = "GitHubError";
  }
}

export type Issue = {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  createdAt: string;
  closedAt: string | null;
  url: string;
};

type Opts = { token: string; fetchFn?: typeof fetch };
type Files = { path: string; content: Uint8Array | string }[];

const seg = (s: string) => s.split("/").map(encodeURIComponent).join("/");
const b64 = (c: Uint8Array | string) => Buffer.from(c).toString("base64");

export function createGitHub({ token, fetchFn = fetch }: Opts) {
  const raw = async (repo: string, method: string, path: string, body?: unknown) => {
    if (!REPO_RE.test(repo) || repo.split("/").some((p) => /^\.+$/.test(p)))
      throw new Error("Ungültiger Repo-Name");
    const res = await fetchFn(`${API}/repos/${repo}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return res;
  };
  const call = async (repo: string, method: string, path: string, body?: unknown) => {
    const res = await raw(repo, method, path, body);
    if (!res.ok) throw new GitHubError(res.status, path);
    return res;
  };
  // biome-ignore lint/suspicious/noExplicitAny: GitHub-JSON wird direkt gemappt
  const data = async (repo: string, method: string, path: string, body?: unknown): Promise<any> =>
    (await call(repo, method, path, body)).json();

  const refPath = (branch: string) => `heads/${seg(branch)}`;

  const commitFiles = async (
    repo: string,
    o: { branch: string; base?: string; message: string; files: Files },
  ) => {
    let isNew = false;
    let headRes = await raw(repo, "GET", `git/ref/${refPath(o.branch)}`);
    if (headRes.status === 404) {
      isNew = true;
      headRes = await raw(repo, "GET", `git/ref/${refPath(o.base ?? "main")}`);
    }
    if (!headRes.ok) throw new GitHubError(headRes.status, "git/ref");
    const head: string = (await headRes.json()).object.sha;
    const parent = await data(repo, "GET", `git/commits/${head}`);
    const tree = [];
    for (const f of o.files) {
      const blob = await data(repo, "POST", "git/blobs", {
        content: b64(f.content),
        encoding: "base64",
      });
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const t = await data(repo, "POST", "git/trees", { base_tree: parent.tree.sha, tree });
    const c = await data(repo, "POST", "git/commits", {
      message: o.message,
      tree: t.sha,
      parents: [head],
    });
    if (isNew) {
      await call(repo, "POST", "git/refs", { ref: `refs/heads/${o.branch}`, sha: c.sha });
    } else {
      await call(repo, "PATCH", `git/refs/${refPath(o.branch)}`, { sha: c.sha });
    }
    return { sha: c.sha as string };
  };

  const createIssue = async (
    repo: string,
    o: { title: string; body: string; labels: string[] },
  ) => {
    const r = await data(repo, "POST", "issues", o);
    return { number: r.number as number, url: r.html_url as string };
  };

  const updateIssue = async (
    repo: string,
    nr: number,
    o: { body?: string; labels?: string[]; state?: "open" | "closed" },
  ) => {
    await call(repo, "PATCH", `issues/${nr}`, o);
  };

  const comment = async (repo: string, nr: number, body: string) => {
    await call(repo, "POST", `issues/${nr}/comments`, { body });
  };

  const listIssues = async (
    repo: string,
    o: { labels?: string[]; state?: "open" | "closed" | "all" } = {},
  ): Promise<Issue[]> => {
    const out: Issue[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const q = new URLSearchParams({ state: o.state ?? "open" });
      if (o.labels?.length) q.set("labels", o.labels.join(","));
      q.set("per_page", "100");
      q.set("page", String(page));
      const res = await call(repo, "GET", `issues?${q}`);
      // biome-ignore lint/suspicious/noExplicitAny: GitHub-JSON
      for (const i of (await res.json()) as any[]) {
        if (i.pull_request) continue;
        out.push({
          number: i.number,
          title: i.title,
          body: i.body ?? "",
          state: i.state,
          // biome-ignore lint/suspicious/noExplicitAny: Label ist String oder Objekt
          labels: i.labels.map((l: any) => (typeof l === "string" ? l : l.name)),
          createdAt: i.created_at,
          closedAt: i.closed_at ?? null,
          url: i.html_url,
        });
      }
      if (!/rel="next"/.test(res.headers.get("Link") ?? "")) break;
    }
    return out;
  };

  const listComments = async (repo: string, nr: number) => {
    // ponytail: eine Seite (100 Kommentare); Paginierung, falls Issues länger werden
    const r = await data(repo, "GET", `issues/${nr}/comments?per_page=100`);
    // biome-ignore lint/suspicious/noExplicitAny: GitHub-JSON
    return (r as any[]).map((c) => ({ body: c.body as string, createdAt: c.created_at as string }));
  };

  const removeLabel = async (repo: string, nr: number, label: string) => {
    const res = await raw(repo, "DELETE", `issues/${nr}/labels/${encodeURIComponent(label)}`);
    if (!res.ok && res.status !== 404) throw new GitHubError(res.status, `issues/${nr}/labels`);
  };

  return { commitFiles, createIssue, updateIssue, comment, listIssues, listComments, removeLabel };
}

export type GitHub = ReturnType<typeof createGitHub>;
