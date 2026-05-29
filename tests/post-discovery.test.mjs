import assert from 'node:assert/strict';
import test from 'node:test';
import { filterPosts, normalizeFilterValue, postMatchesFilters } from '../src/lib/post-discovery.js';

const posts = [
  {
    title: 'Static Publishing',
    description: 'A deployment-focused guide',
    tags: ['Astro', 'Static'],
    year: '2026',
  },
  {
    title: 'Markdown Notes',
    description: 'Writing syntax and source links',
    tags: ['Markdown', 'Source'],
    year: '2023',
  },
];

test('normalizeFilterValue folds spacing, width, and case', () => {
  assert.equal(normalizeFilterValue('  Ａｓｔｒｏ  '), 'astro');
});

test('postMatchesFilters matches query, tag, and year together', () => {
  assert.equal(postMatchesFilters(posts[0], { query: 'deploy', tag: 'astro', year: '2026' }), true);
  assert.equal(postMatchesFilters(posts[0], { query: 'deploy', tag: 'markdown', year: '2026' }), false);
  assert.equal(postMatchesFilters(posts[0], { query: 'deploy', tag: 'astro', year: '2023' }), false);
});

test('filterPosts returns only matching posts', () => {
  assert.deepEqual(filterPosts(posts, { query: 'source', tag: 'all', year: 'all' }), [posts[1]]);
});
