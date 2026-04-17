import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("posts", (p) => p.data.lang === "de" && !p.data.draft)).sort(
    (a, b) => +b.data.pubDate - +a.data.pubDate,
  );
  return rss({
    title: "lkmedia Blog",
    description: "SEO, Webentwicklung, Marketing.",
    site: context.site ?? "https://lkmedia.net",
    items: posts.map((p) => {
      const slug = p.id.replace(/^(de|en)\//, "");
      const link = p.data.route === "root" ? `/${slug}/` : `/blog/${slug}/`;
      return {
        title: p.data.title,
        pubDate: p.data.pubDate,
        description: p.data.description,
        link,
      };
    }),
  });
}
