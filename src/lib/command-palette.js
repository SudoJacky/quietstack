const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();

const entryText = (entry) => normalize([entry.title, entry.type, ...(entry.tags ?? [])].filter(Boolean).join(' '));

export function filterCommandEntries(entries, query, limit = 12) {
  const normalizedQuery = normalize(query);
  const matches = normalizedQuery ? entries.filter((entry) => entryText(entry).includes(normalizedQuery)) : entries;
  return matches.slice(0, limit);
}

export function nextCommandIndex(current, direction, total) {
  if (total <= 0) return -1;
  if (current < 0) return direction < 0 ? total - 1 : 0;
  return (current + direction + total) % total;
}
