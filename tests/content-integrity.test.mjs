import assert from 'node:assert/strict';
import test from 'node:test';
import { collectContentIntegrityIssues } from '../src/lib/content-integrity.js';

const post = (overrides = {}) => ({
  id: 'hello-post',
  collection: 'posts',
  body: '',
  data: {
    draft: false,
    tags: [],
    references: [],
    ...overrides,
  },
});

test('missing and draft sources warn without blocking public post builds', () => {
  const issues = collectContentIntegrityIssues({
    posts: [
      post({
        references: [
          { id: 'missing', source: 'missing-source' },
          { id: 'draft', source: 'draft-source' },
        ],
      }),
    ],
    notes: [],
    pages: [],
    series: [],
    sources: [{ id: 'draft-source', data: { draft: true } }],
  });

  assert.deepEqual(issues.errors, []);
  assert.deepEqual(issues.warnings, [
    'Post "hello-post" references missing Source "missing-source"; the citation will render without source viewer data until the Source is uploaded.',
    'Public Post "hello-post" references draft Source "draft-source"; the citation will render without source viewer data until the Source is published.',
  ]);
});

test('missing and draft series remain blocking content errors', () => {
  const issues = collectContentIntegrityIssues({
    posts: [
      post({ series: 'missing-series' }),
      post({ series: 'draft-series' }),
    ],
    notes: [],
    pages: [],
    series: [{ id: 'draft-series', data: { draft: true } }],
    sources: [],
  });

  assert.deepEqual(issues.errors, [
    'Post "hello-post" references missing Series "missing-series".',
    'Public Post "hello-post" references draft Series "draft-series".',
  ]);
  assert.deepEqual(issues.warnings, []);
});
