import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts", (p) => !p.data.draft && !p.data.noindex);
  const lines = [
    "# lkmedia — full content index for LLMs",
    "",
    ...posts.map((p) => {
      const slug = p.id.replace(/^(de|en)\//, "");
      const prefix = p.data.lang === "de" ? "" : "/en";
      const link =
        p.data.route === "root"
          ? `https://lkmedia.net${prefix}/${slug}/`
          : `https://lkmedia.net${prefix}/blog/${slug}/`;
      const dates = [
        `Published: ${p.data.pubDate.toISOString().slice(0, 10)}`,
        ...(p.data.updatedDate
          ? [`Updated: ${p.data.updatedDate.toISOString().slice(0, 10)}`]
          : []),
      ].join("\n");
      return `## ${p.data.title}\n${link}\nAuthor: ${p.data.author}\nLanguage: ${p.data.lang}\n${dates}\n${p.data.description}\n\n${p.body ?? ""}\n\n---\n`;
    }),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
