const storageKey = 'quietstackReadingState';
const emptyState = () => ({ posts: {} });
const clampProgress = (progress) => Math.min(1, Math.max(0, Number(progress) || 0));

export function readReadingState(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(storageKey) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return { posts: parsed.posts && typeof parsed.posts === 'object' ? parsed.posts : {} };
  } catch {
    return emptyState();
  }
}

export function writeReadingState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function updateReadingEntry(state, slug, progress, now = new Date()) {
  const next = {
    posts: {
      ...(state?.posts ?? {}),
    },
  };
  const normalizedProgress = clampProgress(progress);

  next.posts[slug] = {
    ...(next.posts[slug] ?? {}),
    lastVisited: now.toISOString(),
    progress: normalizedProgress,
    read: normalizedProgress >= 0.85 || Boolean(next.posts[slug]?.read),
  };

  return next;
}
