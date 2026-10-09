import { describe, expect, it, vi } from "vitest";
import { GitHubError, createGitHub } from "../../src/lib/github";

type Call = { method: string; path: string; body: any };
const json = (o: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(o), { status: 200, ...init });

// Mock-fetch: antwortet per "METHOD /pfad" und zeichnet alle Aufrufe auf.
const mk = (routes: Record<string, () => Response>) => {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = new URL(url);
    const method = init.method ?? "GET";
    const path = u.pathname.replace("/repos/Livvux/kunden/", "") + u.search;
    calls.push({ method, path, body: init.body ? JSON.parse(init.body as string) : undefined });
    const r = routes[`${method} ${path}`];
    if (!r) throw new Error(`unerwartet: ${method} ${path}`);
    return r();
  });
  return { calls, gh: createGitHub({ token: "tok", fetchFn: fn as unknown as typeof fetch }), fn };
};
const seq = (c: Call[]) => c.map((x) => `${x.method} ${x.path}`);

const commitRoutes = {
  "GET git/commits/head1": () => json({ tree: { sha: "tree1" } }),
  "POST git/blobs": () => json({ sha: "blob" }),
  "POST git/trees": () => json({ sha: "tree2" }),
  "POST git/commits": () => json({ sha: "commit2" }),
};

describe("commitFiles", () => {
  it("committet auf existierenden Branch", async () => {
    const { gh, calls, fn } = mk({
      ...commitRoutes,
      "GET git/ref/heads/main": () => json({ object: { sha: "head1" } }),
      "PATCH git/refs/heads/main": () => json({}),
    });
    const r = await gh.commitFiles("Livvux/kunden", {
      branch: "main",
      message: "m",
      files: [
        { path: "a.txt", content: "hi" },
        { path: "b.bin", content: new Uint8Array([1, 2]) },
      ],
    });
    expect(r).toEqual({ sha: "commit2" });
    expect(seq(calls)).toEqual([
      "GET git/ref/heads/main",
      "GET git/commits/head1",
      "POST git/blobs",
      "POST git/blobs",
      "POST git/trees",
      "POST git/commits",
      "PATCH git/refs/heads/main",
    ]);
    expect(calls[2].body).toEqual({ content: "aGk=", encoding: "base64" });
    expect(calls[3].body.content).toBe("AQI=");
    expect(calls[4].body.base_tree).toBe("tree1");
    expect(calls[4].body.tree).toHaveLength(2);
    expect(calls[5].body.parents).toEqual(["head1"]);
    const h = (fn.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer tok");
    expect(h["X-GitHub-Api-Version"]).toBe("2022-11-28");
  });

  it("legt fehlenden Branch von main an", async () => {
    const { gh, calls } = mk({
      ...commitRoutes,
      "GET git/ref/heads/aenderung/7": () => new Response("{}", { status: 404 }),
      "GET git/ref/heads/main": () => json({ object: { sha: "head1" } }),
      "POST git/refs": () => json({}),
    });
    await gh.commitFiles("Livvux/kunden", {
      branch: "aenderung/7",
      message: "m",
      files: [{ path: "a", content: "x" }],
    });
    const last = calls[calls.length - 1];
    expect(last.method).toBe("POST");
    expect(last.path).toBe("git/refs");
    expect(last.body).toEqual({ ref: "refs/heads/aenderung/7", sha: "commit2" });
  });

  it("lehnt ungültigen repo-Namen ab", async () => {
    const { gh } = mk({});
    await expect(
      gh.commitFiles("../x", { branch: "main", message: "m", files: [] }),
    ).rejects.toThrow();
  });
});

describe("Issues", () => {
  const raw = (n: number, extra = {}) => ({
    number: n,
    title: `t${n}`,
    body: null,
    state: "open",
    labels: [{ name: "a" }, "b"],
    created_at: "c",
    closed_at: null,
    html_url: `u${n}`,
    ...extra,
  });

  it("listIssues: filtert PRs, folgt Link next, mappt Felder", async () => {
    const next = { headers: { Link: '<https://api.github.com/x?page=2>; rel="next"' } };
    const { gh, calls } = mk({
      "GET issues?state=open&labels=a%2Cb&per_page=100&page=1": () =>
        json([raw(1), raw(2, { pull_request: {} })], next),
      "GET issues?state=open&labels=a%2Cb&per_page=100&page=2": () => json([raw(3)]),
    });
    const r = await gh.listIssues("Livvux/kunden", { labels: ["a", "b"], state: "open" });
    expect(r.map((i) => i.number)).toEqual([1, 3]);
    expect(r[0]).toEqual({
      number: 1,
      title: "t1",
      body: "",
      state: "open",
      labels: ["a", "b"],
      createdAt: "c",
      closedAt: null,
      url: "u1",
    });
    expect(calls).toHaveLength(2);
  });

  it("createIssue, updateIssue, comment, listComments", async () => {
    const { gh, calls } = mk({
      "POST issues": () => json({ number: 7, html_url: "u7" }),
      "PATCH issues/7": () => json({}),
      "POST issues/7/comments": () => json({}),
      "GET issues/7/comments?per_page=100": () => json([{ body: "b", created_at: "c", x: 1 }]),
    });
    expect(await gh.createIssue("Livvux/kunden", { title: "t", body: "b", labels: ["l"] })).toEqual(
      { number: 7, url: "u7" },
    );
    await gh.updateIssue("Livvux/kunden", 7, { state: "closed" });
    await gh.comment("Livvux/kunden", 7, "hi");
    expect(await gh.listComments("Livvux/kunden", 7)).toEqual([{ body: "b", createdAt: "c" }]);
    expect(calls[1].body).toEqual({ state: "closed" });
    expect(calls[2].body).toEqual({ body: "hi" });
  });

  it("removeLabel ignoriert 404, wirft sonst", async () => {
    const a = mk({ "DELETE issues/7/labels/in%20arbeit": () => new Response("", { status: 404 }) });
    await expect(a.gh.removeLabel("Livvux/kunden", 7, "in arbeit")).resolves.toBeUndefined();
    const b = mk({ "DELETE issues/7/labels/x": () => new Response("", { status: 403 }) });
    await expect(b.gh.removeLabel("Livvux/kunden", 7, "x")).rejects.toBeInstanceOf(GitHubError);
  });
});

describe("Fehler", () => {
  it("500 wirft GitHubError ohne Token in der Meldung", async () => {
    const { gh } = mk({ "POST issues": () => new Response("boom tok", { status: 500 }) });
    const e = await gh
      .createIssue("Livvux/kunden", { title: "t", body: "geheim", labels: [] })
      .catch((x) => x);
    expect(e).toBeInstanceOf(GitHubError);
    expect(e.status).toBe(500);
    expect(e.path).toBe("issues");
    expect(e.message).not.toContain("tok");
    expect(e.message).not.toContain("geheim");
  });
});
