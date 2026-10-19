import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { blogTopicIds } from "./lib/blog-topics";

const postSchema = z.object({
  title: z.string().max(70),
  description: z.string().max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  lang: z.literal("de"),
  author: z.string().default("Lucas Kleipoedszus"),
  tags: z.array(z.string()).default([]),
  topic: z.enum(blogTopicIds).optional(),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  noindex: z.boolean().default(false),
  route: z.enum(["blog", "root"]).default("blog"),
});

const caseMediaSchema = z.object({
  image: z.string(),
  alt: z.string(),
  caption: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  video: z.string().optional(),
});

export type CaseMedia = z.infer<typeof caseMediaSchema>;

const caseSchema = z.object({
  title: z.string(),
  client: z.string(),
  niche: z.enum([
    "anwaelte",
    "luxus-immobilien",
    "privatkliniken",
    "fintech",
    "other",
    "tierschutz",
    "gaming",
    "creator",
  ]),
  summary: z.string(),
  heroImage: z.string(),
  website: z.string().url().optional(),
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
