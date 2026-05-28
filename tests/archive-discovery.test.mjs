import test from 'node:test';
import assert from 'node:assert/strict';
import { collectArchiveTags, groupArchiveItemsByYear, matchesArchiveFilters } from '../src/lib/archive-discovery.js';

const items = [
  {
    href: '/posts/static-blog/',
    title: 'Static blog',
    date: new Date('2026-04-10T00:00:00Z'),
    type: 'Post',
    tags: ['Astro', 'Publishing'],
  },
  {
    href: '/notes/source-viewer/',
    title: 'Source viewer note',
    date: new Date('2025-11-02T00:00:00Z'),
    type: 'Note',
    tags: ['sources'],
  },
  {
    href: '/posts/search/',
    title: 'Search improvements',
    date: new Date('2026-01-05T00:00:00Z'),
    type: 'Post',
    tags: ['Astro'],
  },
];

test('groupArchiveItemsByYear keeps reverse chronological year groups', () => {
  assert.deepEqual(groupArchiveItemsByYear(items), [
    { year: '2026', items: [items[0], items[2]] },
    { year: '2025', items: [items[1]] },
  ]);
});

test('collectArchiveTags returns unique tags sorted by label', () => {
  assert.deepEqual(collectArchiveTags(items), ['Astro', 'Publishing', 'sources']);
});

test('matchesArchiveFilters supports type and normalized tag filters', () => {
  assert.equal(matchesArchiveFilters(items[0], { type: 'post', tag: 'astro' }), true);
  assert.equal(matchesArchiveFilters(items[0], { type: 'note', tag: 'astro' }), false);
  assert.equal(matchesArchiveFilters(items[1], { type: 'all', tag: 'SOURCES' }), true);
});
