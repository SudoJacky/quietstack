const dateValue = (post) => new Date(post.date ?? 0).valueOf();
const normalizeTag = (tag) => String(tag ?? '').normalize('NFKC').trim().toLocaleLowerCase();

export function adjacentPosts(posts, currentId) {
  const index = posts.findIndex((post) => post.id === currentId);

  return {
    previous: index > 0 ? posts[index - 1] : undefined,
    next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export function relatedPosts(posts, currentId, limit = 3) {
  const current = posts.find((post) => post.id === currentId);
  if (!current) return [];

  const currentTags = new Set((current.tags ?? []).map(normalizeTag));

  return posts
    .filter((post) => post.id !== currentId)
    .map((post) => ({
      post,
      score: (post.tags ?? []).map(normalizeTag).filter((tag) => currentTags.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || dateValue(b.post) - dateValue(a.post))
    .slice(0, limit)
    .map((entry) => entry.post);
}
