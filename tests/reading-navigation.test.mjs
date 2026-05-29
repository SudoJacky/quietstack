import assert from 'node:assert/strict';
import test from 'node:test';
import { adjacentPosts, relatedPosts } from '../src/lib/reading-navigation.js';

const posts = [
  { id: 'latest', title: 'Latest', date: '2026-05-01T00:00:00.000Z', tags: ['astro'] },
  { id: 'current', title: 'Current', date: '2026-04-01T00:00:00.000Z', tags: ['astro', 'markdown'] },
  { id: 'older-related', title: 'Older related', date: '2026-03-01T00:00:00.000Z', tags: ['markdown'] },
  { id: 'oldest', title: 'Oldest', date: '2026-02-01T00:00:00.000Z', tags: ['other'] },
];

test('adjacentPosts returns newer previous and older next posts', () => {
  assert.deepEqual(adjacentPosts(posts, 'current'), {
    previous: posts[0],
    next: posts[2],
  });
});

test('adjacentPosts returns undefined edges at collection boundaries', () => {
  assert.deepEqual(adjacentPosts(posts, 'latest'), {
    previous: undefined,
    next: posts[1],
  });
});

test('relatedPosts ranks by shared tag count and then recency', () => {
  const result = relatedPosts(posts, 'current', 3);
  assert.deepEqual(result.map((post) => post.id), ['latest', 'older-related']);
});
