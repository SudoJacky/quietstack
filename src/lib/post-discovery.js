export const normalizeFilterValue = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();

const searchableText = (post) =>
  normalizeFilterValue([post.title, post.description, post.year, ...(post.tags ?? [])].filter(Boolean).join(' '));

export function postMatchesFilters(post, { query = '', tag = 'all', year = 'all' } = {}) {
  const normalizedQuery = normalizeFilterValue(query);
  const normalizedTag = normalizeFilterValue(tag);
  const normalizedYear = normalizeFilterValue(year);
  const tags = (post.tags ?? []).map(normalizeFilterValue);

  const queryMatches = !normalizedQuery || searchableText(post).includes(normalizedQuery);
  const tagMatches = normalizedTag === 'all' || tags.includes(normalizedTag);
  const yearMatches = normalizedYear === 'all' || normalizeFilterValue(post.year) === normalizedYear;

  return queryMatches && tagMatches && yearMatches;
}

export function filterPosts(posts, filters = {}) {
  return posts.filter((post) => postMatchesFilters(post, filters));
}
