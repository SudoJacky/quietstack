const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function readingProgressRatio({ scrollY = 0, viewportHeight = 0, documentHeight = 0 }) {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return 1;
  return clamp01(scrollY / scrollable);
}

export function tocIndicatorStyle({ linkTop = 0, containerTop = 0, linkHeight = 0 }) {
  return {
    top: `${Math.round(linkTop - containerTop)}px`,
    height: `${Math.round(linkHeight)}px`,
  };
}
