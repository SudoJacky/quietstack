import { getCollection, type CollectionEntry } from 'astro:content';

const reservedPageSlugs = new Set(['posts', 'notes', 'archive', 'search', 'tags', 'series', 'rss.xml', 'sitemap.xml', 'assets']);
const rootAbsoluteMarkdownLinkPattern = /(?<!!)\[[^\]]*\]\((\/(?!\/)[^)]+)\)/g;

type ContentEntry = CollectionEntry<'posts'> | CollectionEntry<'notes'> | CollectionEntry<'pages'>;

let validationPromise: Promise<void> | undefined;

const tagKey = (tag: string) => tag.normalize('NFKC').trim().toLocaleLowerCase();

function collectRootAbsoluteLinks(entry: ContentEntry) {
  const body = entry.body ?? '';
  const links = [...body.matchAll(rootAbsoluteMarkdownLinkPattern)].map((match) => match[1]);
  return links.map((link) => `${entry.collection}/${entry.id}: ${link}`);
}

export async function validateContentIntegrity() {
  validationPromise ??= runValidation();
  return validationPromise;
}

async function runValidation() {
  const [posts, notes, pages, series] = await Promise.all([
    getCollection('posts'),
    getCollection('notes'),
    getCollection('pages'),
    getCollection('series'),
  ]);

  const errors: string[] = [];
  const seriesById = new Map(series.map((item) => [item.id, item]));

  for (const post of posts) {
    if (!post.data.series) continue;
    const referencedSeries = seriesById.get(post.data.series);
    if (!referencedSeries) {
      errors.push(`Post "${post.id}" references missing Series "${post.data.series}".`);
      continue;
    }
    if (!post.data.draft && referencedSeries.data.draft) {
      errors.push(`Public Post "${post.id}" references draft Series "${post.data.series}".`);
    }
  }

  const tagNamesByKey = new Map<string, string>();
  for (const tag of [...posts.flatMap((post) => post.data.tags), ...notes.flatMap((note) => note.data.tags)]) {
    const key = tagKey(tag);
    const existing = tagNamesByKey.get(key);
    if (existing && existing !== tag) {
      errors.push(`Tag "${tag}" conflicts with "${existing}" after normalization.`);
    }
    tagNamesByKey.set(key, tag);
  }

  for (const page of pages) {
    if (reservedPageSlugs.has(page.id)) {
      errors.push(`Page slug "${page.id}" conflicts with a reserved system route.`);
    }
  }

  const rootAbsoluteLinks = [...posts, ...notes, ...pages].flatMap(collectRootAbsoluteLinks);
  if (rootAbsoluteLinks.length) {
    errors.push(`Root-absolute internal Markdown links are not portable:\n${rootAbsoluteLinks.join('\n')}`);
  }

  if (errors.length) {
    throw new Error(`Content integrity validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}
