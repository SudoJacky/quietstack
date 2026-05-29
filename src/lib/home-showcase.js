const countItems = (items) => (Array.isArray(items) ? items.length : 0);

export function buildHeroStats({ posts, notes, sources } = {}) {
  return [
    { label: 'Posts', value: String(countItems(posts)), tone: 'teal' },
    { label: 'Notes', value: String(countItems(notes)), tone: 'amber' },
    { label: 'Sources', value: String(countItems(sources)), tone: 'green' },
    { label: 'Search', value: 'Pagefind', tone: 'blue' },
  ];
}

export const publishingFlowSteps = [
  {
    label: 'Markdown',
    description: 'Posts, notes, pages, and sources live as repository files.',
  },
  {
    label: 'Collections',
    description: 'Astro validates frontmatter and renders stable routes.',
  },
  {
    label: 'Source Citations',
    description: 'Article claims can open exact attachment lines or headings.',
  },
  {
    label: 'Pagefind',
    description: 'Search indexes rebuild with the static output.',
  },
  {
    label: 'Static Deploy',
    description: 'The final dist folder can be hosted anywhere.',
  },
];

export const sourceShowcase = {
  articleTitle: 'Hello Quietstack',
  citation: 'source:quietstack-notes#lines=11',
  sourceTitle: 'Quietstack source notes',
  sourcePath: 'content/sources/quietstack-notes.md',
  command: 'astro build && pagefind --site dist',
  lines: [
    { number: 9, text: '## Static output' },
    { number: 10, text: '' },
    { number: 11, text: 'Production builds generate static HTML, feeds, search data, and a Pagefind index.', highlighted: true },
  ],
};
