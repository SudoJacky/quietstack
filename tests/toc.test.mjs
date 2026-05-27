import assert from 'node:assert/strict';
import test from 'node:test';
import { filterTocHeadings, getActiveTocSlug } from '../src/lib/toc.js';

test('filterTocHeadings keeps only h2 and h3 headings with slugs', () => {
  const headings = filterTocHeadings([
    { depth: 1, slug: 'title', text: 'Title' },
    { depth: 2, slug: 'section', text: 'Section' },
    { depth: 3, slug: 'detail', text: 'Detail' },
    { depth: 4, slug: 'deep', text: 'Deep' },
    { depth: 2, slug: '', text: 'Missing slug' },
  ]);

  assert.deepEqual(headings, [
    { depth: 2, slug: 'section', text: 'Section' },
    { depth: 3, slug: 'detail', text: 'Detail' },
  ]);
});

test('getActiveTocSlug follows the latest heading above the viewport offset', () => {
  const headings = [
    { slug: 'intro', top: 180 },
    { slug: 'syntax', top: 420 },
    { slug: 'tables', top: 760 },
  ];

  assert.equal(getActiveTocSlug(headings, 0, 120), 'intro');
  assert.equal(getActiveTocSlug(headings, 360, 120), 'syntax');
  assert.equal(getActiveTocSlug(headings, 900, 120), 'tables');
});
