import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const language = z.string().default('zh-CN');
const coverMetadata = z.object({
  image: z.string(),
  alt: z.string(),
});

const postMetadata = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  lang: language,
  series: z.string().optional(),
  cover: coverMetadata.optional(),
  canonicalUrl: z.url().optional(),
  searchText: z.string().optional(),
  references: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        title: z.string().optional(),
        pdf: z.string().optional(),
      }),
    )
    .default([]),
  discussionLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.url(),
      }),
    )
    .default([]),
});

const noteMetadata = z.object({
  title: z.string().optional(),
  pubDate: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  lang: language,
  searchText: z.string().optional(),
});

const pageMetadata = z.object({
  title: z.string(),
  description: z.string().optional(),
  cover: coverMetadata.optional(),
  draft: z.boolean().default(false),
  lang: language,
});

const seriesMetadata = z.object({
  title: z.string(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
});

const sourceMetadata = z.object({
  title: z.string(),
  description: z.string().optional(),
  pdf: z.string().optional(),
  draft: z.boolean().default(false),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: postMetadata,
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: noteMetadata,
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: pageMetadata,
});

const series = defineCollection({
  loader: glob({ base: './src/content/series', pattern: '**/*.json' }),
  schema: seriesMetadata,
});

const sources = defineCollection({
  loader: glob({ base: './src/content/sources', pattern: '**/*.{md,mdx}' }),
  schema: sourceMetadata,
});

export const collections = { posts, notes, pages, series, sources };
