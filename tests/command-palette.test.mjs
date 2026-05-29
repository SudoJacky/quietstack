import assert from 'node:assert/strict';
import test from 'node:test';
import { filterCommandEntries, nextCommandIndex } from '../src/lib/command-palette.js';

const entries = [
  { title: 'Posts', type: 'Navigation', tags: [] },
  { title: 'Markdown 渲染测试', type: 'Post', tags: ['Markdown', 'GFM'] },
  { title: 'First Note', type: 'Note', tags: ['quietstack'] },
];

test('filterCommandEntries matches title, type, and tags', () => {
  assert.deepEqual(filterCommandEntries(entries, 'gfm').map((entry) => entry.title), ['Markdown 渲染测试']);
  assert.deepEqual(filterCommandEntries(entries, 'note').map((entry) => entry.title), ['First Note']);
  assert.deepEqual(filterCommandEntries(entries, '').map((entry) => entry.title), ['Posts', 'Markdown 渲染测试', 'First Note']);
});

test('filterCommandEntries respects result limits', () => {
  assert.equal(filterCommandEntries(entries, '', 2).length, 2);
});

test('nextCommandIndex wraps selection in both directions', () => {
  assert.equal(nextCommandIndex(-1, 1, 3), 0);
  assert.equal(nextCommandIndex(2, 1, 3), 0);
  assert.equal(nextCommandIndex(0, -1, 3), 2);
  assert.equal(nextCommandIndex(0, 1, 0), -1);
});
