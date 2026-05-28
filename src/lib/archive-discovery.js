const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();

export function groupArchiveItemsByYear(items) {
  const groups = new Map();

  for (const item of items) {
    const year = String(item.date.getFullYear());
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, yearItems]) => ({ year, items: yearItems.sort((a, b) => b.date.valueOf() - a.date.valueOf()) }));
}

export function collectArchiveTags(items) {
  const tags = new Map();

  for (const item of items) {
    for (const tag of item.tags ?? []) {
      const key = normalize(tag);
      if (!tags.has(key)) tags.set(key, tag);
    }
  }

  return [...tags.values()].sort((a, b) => a.localeCompare(b));
}

export function matchesArchiveFilters(item, filters = {}) {
  const type = normalize(filters.type || 'all');
  const tag = normalize(filters.tag || 'all');
  const typeMatches = type === 'all' || normalize(item.type) === type;
  const tagMatches = tag === 'all' || (item.tags ?? []).some((itemTag) => normalize(itemTag) === tag);

  return typeMatches && tagMatches;
}
