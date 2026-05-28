const reservedPageSlugs = new Set(['posts', 'notes', 'archive', 'search', 'tags', 'series', 'rss.xml', 'sitemap.xml', 'assets']);
const rootAbsoluteMarkdownLinkPattern = /(?<!!)\[[^\]]*\]\((\/(?!\/)[^)]+)\)/g;

const tagKey = (tag) => tag.normalize('NFKC').trim().toLocaleLowerCase();

function collectRootAbsoluteLinks(entry) {
  const body = entry.body ?? '';
  const links = [...body.matchAll(rootAbsoluteMarkdownLinkPattern)].map((match) => match[1]);
  return links.map((link) => `${entry.collection}/${entry.id}: ${link}`);
}

export function collectContentIntegrityIssues({ posts, notes, pages, series, sources }) {
  const errors = [];
  const warnings = [];
  const seriesById = new Map(series.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));

  for (const post of posts) {
    if (post.data.series) {
      const referencedSeries = seriesById.get(post.data.series);
      if (!referencedSeries) {
        errors.push(`Post "${post.id}" references missing Series "${post.data.series}".`);
      } else if (!post.data.draft && referencedSeries.data.draft) {
        errors.push(`Public Post "${post.id}" references draft Series "${post.data.series}".`);
      }
    }

    for (const reference of post.data.references) {
      const source = sourcesById.get(reference.source);
      if (!source) {
        warnings.push(
          `Post "${post.id}" references missing Source "${reference.source}"; the citation will render without source viewer data until the Source is uploaded.`,
        );
      } else if (!post.data.draft && source.data.draft) {
        warnings.push(
          `Public Post "${post.id}" references draft Source "${reference.source}"; the citation will render without source viewer data until the Source is published.`,
        );
      }
    }
  }

  const tagNamesByKey = new Map();
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

  return { errors, warnings };
}
