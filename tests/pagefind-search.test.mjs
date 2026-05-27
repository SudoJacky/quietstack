import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSearchResult, renderSearchState, searchStaticItems } from '../src/lib/pagefind-search.js';

test('renderSearchResult preserves Pagefind highlighted excerpts', () => {
  const html = renderSearchResult({
    url: '/posts/example/',
    title: 'Example <Post>',
    excerpt: 'A <mark>matched</mark> excerpt.',
  });

  assert.match(html, /href="\/posts\/example\/"/);
  assert.match(html, /Example &lt;Post&gt;/);
  assert.match(html, /A <mark>matched<\/mark> excerpt\./);
});

test('renderSearchState distinguishes empty query and no results', () => {
  assert.match(renderSearchState('idle'), /Start typing/);
  assert.match(renderSearchState('empty'), /No matching content/);
});

test('searchStaticItems matches local search index content and escapes excerpts', () => {
  const results = searchStaticItems(
    [
      {
        type: 'post',
        title: 'Markdown 渲染测试',
        description: 'CommonMark <script>alert(1)</script> syntax examples.',
        url: '/posts/readme/',
        date: '2023-06-01T14:06:06.000Z',
        tags: ['Markdown', 'GFM'],
      },
      {
        type: 'note',
        title: 'First note',
        excerpt: 'Short note.',
        url: '/notes/first-note/',
        date: '2026-05-19T00:00:00.000Z',
        tags: ['quietstack'],
      },
    ],
    'markdown',
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].url, '/posts/readme/');
  assert.match(results[0].excerpt, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('searchStaticItems matches body text and builds an excerpt around the hit', () => {
  const results = searchStaticItems(
    [
      {
        type: 'post',
        title: 'Markdown 渲染测试',
        description: '以 CommonMark、GFM 标准为基础进行测试。',
        url: '/posts/readme/',
        date: '2023-06-01T14:06:06.000Z',
        tags: ['Markdown'],
        searchText: '前文内容。折叠部分用于验证 details 标签。代码块用于验证高亮。',
      },
    ],
    'details',
  );

  assert.equal(results.length, 1);
  assert.match(results[0].excerpt, /折叠部分用于验证 <mark>details<\/mark> 标签/);
});

test('searchStaticItems ranks title and tag matches above body-only matches', () => {
  const results = searchStaticItems(
    [
      {
        type: 'post',
        title: 'A body-only result',
        description: 'Intro',
        url: '/posts/body/',
        date: '2026-05-19T00:00:00.000Z',
        tags: [],
        searchText: 'This article mentions quietstack in the body.',
      },
      {
        type: 'post',
        title: 'Quietstack roadmap',
        description: 'Intro',
        url: '/posts/title/',
        date: '2026-05-20T00:00:00.000Z',
        tags: [],
        searchText: 'No body hit here.',
      },
      {
        type: 'note',
        title: 'Tagged note',
        excerpt: 'Intro',
        url: '/notes/tag/',
        date: '2026-05-21T00:00:00.000Z',
        tags: ['quietstack'],
      },
    ],
    'quietstack',
  );

  assert.deepEqual(results.map((result) => result.url), ['/posts/title/', '/notes/tag/', '/posts/body/']);
});

test('searchStaticItems normalizes punctuation and mixed case', () => {
  const results = searchStaticItems(
    [
      {
        type: 'post',
        title: 'Syntax notes',
        description: 'CommonMark、GFM 标准。',
        url: '/posts/syntax/',
        date: '2026-05-19T00:00:00.000Z',
        tags: [],
      },
    ],
    'commonmark gfm',
  );

  assert.equal(results.length, 1);
});
