export function filterTocHeadings(headings) {
  return headings.filter((heading) => heading.slug && (heading.depth === 2 || heading.depth === 3));
}

export function getActiveTocSlug(headings, scrollY, offset = 0) {
  if (!headings.length) return undefined;

  const marker = scrollY + offset;
  let activeSlug = headings[0].slug;

  for (const heading of headings) {
    if (heading.top > marker) break;
    activeSlug = heading.slug;
  }

  return activeSlug;
}
