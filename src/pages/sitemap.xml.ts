import type { APIRoute } from 'astro';
import {
  getAllTags,
  getPublicNotes,
  getPublicPages,
  getPublicPosts,
  getPublicSeries,
  notePath,
  pagePath,
  postPath,
  seriesPath,
  tagPath,
} from '@/lib/content';
import { paths } from '@/lib/site';
import { absoluteUrl } from '@/lib/url';

type SitemapEntry = {
  loc: string;
  lastmod?: Date;
};

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });

const renderUrl = (entry: SitemapEntry) => {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod.toISOString()}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
};

export const GET: APIRoute = async () => {
  const [posts, notes, pages, series, tags] = await Promise.all([
    getPublicPosts(),
    getPublicNotes(),
    getPublicPages(),
    getPublicSeries(),
    getAllTags(),
  ]);

  const entries: SitemapEntry[] = [
    { loc: absoluteUrl(paths.home) },
    { loc: absoluteUrl(paths.posts) },
    { loc: absoluteUrl(paths.notes) },
    { loc: absoluteUrl(paths.archive) },
    { loc: absoluteUrl(paths.search) },
    { loc: absoluteUrl(paths.tags) },
    { loc: absoluteUrl(paths.series) },
    ...posts.map((post) => ({
      loc: absoluteUrl(postPath(post)),
      lastmod: post.data.updatedDate ?? post.data.pubDate,
    })),
    ...notes.map((note) => ({
      loc: absoluteUrl(notePath(note)),
      lastmod: note.data.pubDate,
    })),
    ...pages.map((page) => ({
      loc: absoluteUrl(pagePath(page)),
    })),
    ...series.map((item) => ({
      loc: absoluteUrl(seriesPath(item.id)),
    })),
    ...tags.map((tag) => ({
      loc: absoluteUrl(tagPath(tag)),
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(renderUrl)
    .join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
