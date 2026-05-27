export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
}

export function renderSearchResult(result) {
  const title = result.title || result.url;
  return `
    <a class="card search-result" href="${escapeHtml(result.url)}">
      <div class="card__meta">Search result</div>
      <h2>${escapeHtml(title)}</h2>
      ${result.excerpt ? `<p class="search-result__excerpt">${result.excerpt}</p>` : ''}
    </a>
  `;
}

export function renderSearchState(state) {
  const messages = {
    idle: 'Start typing to search Posts, Notes, and Pages.',
    loading: 'Searching...',
    empty: 'No matching content.',
    unavailable: 'Search index is not available yet. Run the production build to generate it.',
  };

  return `<p class="empty-state">${escapeHtml(messages[state] ?? messages.idle)}</p>`;
}

const excerptLength = 180;

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const queryTerms = (value) => normalizeSearchText(value).split(/\s+/).filter(Boolean);

const fieldsForItem = (item) => ({
  title: String(item.title ?? ''),
  tags: Array.isArray(item.tags) ? item.tags.join(' ') : '',
  summary: String(item.description || item.excerpt || ''),
  body: String(item.searchText || ''),
  type: String(item.type ?? ''),
});

const normalizedFieldsForItem = (item) => {
  const fields = fieldsForItem(item);
  return {
    title: normalizeSearchText(fields.title),
    tags: normalizeSearchText(fields.tags),
    summary: normalizeSearchText(fields.summary),
    body: normalizeSearchText(fields.body),
    type: normalizeSearchText(fields.type),
  };
};

const itemSearchText = (item) => Object.values(normalizedFieldsForItem(item)).filter(Boolean).join(' ');

const itemScore = (item, terms) => {
  const fields = normalizedFieldsForItem(item);

  return terms.reduce((score, term) => {
    if (fields.title.includes(term)) return score + 16;
    if (fields.tags.includes(term)) return score + 8;
    if (fields.summary.includes(term)) return score + 4;
    if (fields.body.includes(term)) return score + 1;
    return score;
  }, 0);
};

const findRawMatch = (source, terms) => {
  const normalizedSource = String(source ?? '').normalize('NFKC').toLocaleLowerCase();
  for (const term of terms) {
    const index = normalizedSource.indexOf(term);
    if (index !== -1) return { index, length: term.length };
  }
  return undefined;
};

const highlightedExcerpt = (source, terms) => {
  const text = String(source ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const match = findRawMatch(text, terms);
  if (!match) return escapeHtml(text.slice(0, excerptLength));

  const context = Math.floor((excerptLength - match.length) / 2);
  const start = Math.max(0, match.index - context);
  const end = Math.min(text.length, match.index + match.length + context);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  const before = text.slice(start, match.index);
  const hit = text.slice(match.index, match.index + match.length);
  const after = text.slice(match.index + match.length, end);

  return `${prefix}${escapeHtml(before)}<mark>${escapeHtml(hit)}</mark>${escapeHtml(after)}${suffix}`;
};

const itemExcerpt = (item, terms) => {
  const fields = fieldsForItem(item);
  const normalized = normalizedFieldsForItem(item);

  if (terms.some((term) => normalized.summary.includes(term))) return highlightedExcerpt(fields.summary, terms);
  if (terms.some((term) => normalized.body.includes(term))) return highlightedExcerpt(fields.body, terms);
  return highlightedExcerpt(fields.summary || fields.body, terms);
};

export function searchStaticItems(items, query, limit = 24) {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  return items
    .map((item) => ({ item, text: itemSearchText(item) }))
    .filter(({ text }) => terms.every((term) => text.includes(term)))
    .sort((a, b) => itemScore(b.item, terms) - itemScore(a.item, terms))
    .slice(0, limit)
    .map(({ item }) => ({
      url: item.url,
      title: item.title,
      excerpt: itemExcerpt(item, terms),
    }));
}
