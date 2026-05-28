import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSourceLines, findHighlightLines, parseSourceHref, sourceLineScrollTop } from '../src/lib/source-viewer.js';

test('parseSourceHref reads source id and heading locator', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#heading=experiments'), {
    id: 'smith-2024',
    heading: 'experiments',
  });
});

test('parseSourceHref reads source id and line locator', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#lines=12-18'), {
    id: 'smith-2024',
    lines: { start: 12, end: 18 },
  });
});

test('buildSourceLines creates heading slugs for markdown headings', () => {
  const lines = buildSourceLines('# Paper Title\n\n## Experimental Setup\nResult text');

  assert.deepEqual(
    lines.map((line) => ({ number: line.number, headingSlug: line.headingSlug })),
    [
      { number: 1, headingSlug: 'paper-title' },
      { number: 2, headingSlug: undefined },
      { number: 3, headingSlug: 'experimental-setup' },
      { number: 4, headingSlug: undefined },
    ],
  );
});

test('findHighlightLines supports heading and line locators', () => {
  const lines = buildSourceLines('# Paper Title\n\n## Experimental Setup\nResult text\nConclusion');

  assert.deepEqual(findHighlightLines(lines, { heading: 'experimental-setup' }), { start: 3, end: 3 });
  assert.deepEqual(findHighlightLines(lines, { lines: { start: 4, end: 5 } }), { start: 4, end: 5 });
});

test('sourceLineScrollTop centers highlighted lines inside the source panel', () => {
  assert.equal(sourceLineScrollTop({ clientHeight: 400 }, { offsetTop: 600, clientHeight: 24 }), 412);
  assert.equal(sourceLineScrollTop({ clientHeight: 400 }, { offsetTop: 80, clientHeight: 24 }), 0);
});
