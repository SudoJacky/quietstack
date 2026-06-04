import assert from 'node:assert/strict';
import test from 'node:test';
import { collectContentIntegrityIssues } from '../src/lib/content-integrity.js';

const post = ({ body = '', ...overrides } = {}) => ({
  id: 'hello-post',
  collection: 'posts',
  body,
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

test('source citation locators warn when post body links cannot resolve', () => {
  const issues = collectContentIntegrityIssues({
    posts: [
      post({
        body:
          '[Known missing heading](source:paper#missing-heading)\n' +
          '[Known bad lines](source:paper#L20-L22)\n' +
          '[Invalid line syntax](source:paper#line=abc)\n' +
          '[Unknown ref](source:unknown#intro)',
        references: [{ id: 'paper', source: 'paper-source' }],
      }),
    ],
    notes: [],
    pages: [],
    series: [],
    sources: [
      {
        id: 'paper-source',
        body: '# Intro\n\n### 4.1 Sub Title',
        data: { draft: false },
      },
    ],
  });

  assert.deepEqual(issues.errors, []);
  assert.deepEqual(issues.warnings, [
    'Post "hello-post" Source citation "paper" heading "missing-heading" does not match Source "paper-source".',
    'Post "hello-post" Source citation "paper" lines "20-22" exceed Source "paper-source" length 3.',
    'Post "hello-post" Source citation "paper" fragment "line=abc" could not be parsed.',
    'Post "hello-post" cites unknown Source reference id "unknown".',
  ]);
});

test('duplicate source heading slugs warn because heading locators use the first match', () => {
  const issues = collectContentIntegrityIssues({
    posts: [],
    notes: [],
    pages: [],
    series: [],
    sources: [
      {
        id: 'paper-source',
        body: '# Intro\n\n## Intro',
        data: { draft: false },
      },
    ],
  });

  assert.deepEqual(issues.errors, []);
  assert.deepEqual(issues.warnings, [
    'Source "paper-source" has duplicate heading locator "intro"; source citations will use the first match.',
  ]);
});
