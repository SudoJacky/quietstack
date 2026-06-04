import { buildSourceLines, duplicateSourceHeadingSlugs, findHighlightLines, parseSourceHref } from './source-viewer.js';

const reservedPageSlugs = new Set(['posts', 'notes', 'archive', 'search', 'tags', 'series', 'rss.xml', 'sitemap.xml', 'assets']);
const rootAbsoluteMarkdownLinkPattern = /(?<!!)\[[^\]]*\]\((\/(?!\/)[^)]+)\)/g;
const sourceMarkdownLinkPattern = /(?<!!)\[[^\]]*\]\((source:[^)]+)\)/g;

const tagKey = (tag) => tag.normalize('NFKC').trim().toLocaleLowerCase();

function collectRootAbsoluteLinks(entry) {
  const body = entry.body ?? '';
  const links = [...body.matchAll(rootAbsoluteMarkdownLinkPattern)].map((match) => match[1]);
  return links.map((link) => `${entry.collection}/${entry.id}: ${link}`);
}

function collectSourceLinks(entry) {
  const body = entry.body ?? '';
  return [...body.matchAll(sourceMarkdownLinkPattern)].map((match) => match[1]);
}

function lineLabel(lines) {
  return lines.start === lines.end ? `${lines.start}` : `${lines.start}-${lines.end}`;
}

export function collectContentIntegrityIssues({ posts, notes, pages, series, sources }) {
  const errors = [];
  const warnings = [];
  const seriesById = new Map(series.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));

  for (const source of sources) {
    for (const headingSlug of duplicateSourceHeadingSlugs(source.body ?? '')) {
      warnings.push(`Source "${source.id}" has duplicate heading locator "${headingSlug}"; source citations will use the first match.`);
    }
  }

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

    const referencesById = new Map(post.data.references.map((reference) => [reference.id, reference]));
    for (const sourceLink of collectSourceLinks(post)) {
      const locator = parseSourceHref(sourceLink);
      if (!locator) continue;

      const reference = referencesById.get(locator.id);
      if (!reference) {
        warnings.push(`Post "${post.id}" cites unknown Source reference id "${locator.id}".`);
        continue;
      }

      const source = sourcesById.get(reference.source);
      if (!source || source.data.draft) continue;

      const lines = buildSourceLines(source.body ?? '');
      if (locator.invalidFragment) {
        warnings.push(`Post "${post.id}" Source citation "${locator.id}" fragment "${locator.invalidFragment}" could not be parsed.`);
      } else if (locator.heading && !findHighlightLines(lines, locator)) {
        warnings.push(`Post "${post.id}" Source citation "${locator.id}" heading "${locator.heading}" does not match Source "${source.id}".`);
      } else if (locator.lines && locator.lines.end > lines.length) {
        warnings.push(
          `Post "${post.id}" Source citation "${locator.id}" lines "${lineLabel(locator.lines)}" exceed Source "${source.id}" length ${lines.length}.`,
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
