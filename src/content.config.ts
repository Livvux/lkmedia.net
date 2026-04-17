import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postSchema = z.object({
  title: z.string().max(70),
  description: z.string().max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  lang: z.enum(["de", "en"]),
  author: z.string().default("Lucas Kleipoedszus"),
  tags: z.array(z.string()).default([]),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  route: z.enum(["blog", "root"]).default("blog"),
});

const caseSchema = z.object({
  title: z.string(),
  client: z.string(),
  niche: z.enum(["anwaelte", "luxus-immobilien", "privatkliniken", "fintech", "other"]),
  summary: z.string(),
  heroImage: z.string(),
  pubDate: z.coerce.date(),
  featured: z.boolean().default(false),
});

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
    schema: postSchema,
  }),
  cases: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
    schema: caseSchema,
  }),
};
