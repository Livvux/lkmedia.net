import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const posts = await getCollection(
    "posts",
    (p) => p.data.lang === "de" && !p.data.draft && !p.data.noindex,
  );
  const lines = [
    "# lkmedia — editorial article index",
    "",
    "Article abstracts with canonical links, authors and editorial dates. This index does not contain full article text. Read and cite the linked article for complete information and current product details.",
    "",
    ...posts.map((p) => {
      const slug = p.id.replace(/^(de|en)\//, "");
      const link =
        p.data.route === "root"
          ? `https://lkmedia.net/${slug}/`
          : `https://lkmedia.net/blog/${slug}/`;
      const dates = [
        `Published: ${p.data.pubDate.toISOString().slice(0, 10)}`,
        ...(p.data.updatedDate
          ? [`Updated: ${p.data.updatedDate.toISOString().slice(0, 10)}`]
          : []),
      ].join("\n");
      return `## ${p.data.title}\n${link}\nAuthor: ${p.data.author}\nLanguage: ${p.data.lang}\n${dates}\nAbstract: ${p.data.description}\n\n---\n`;
    }),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
