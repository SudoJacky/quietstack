import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSourceLines,
  findHighlightLines,
  parseSourceHash,
  parseSourceHref,
  pulseSourceLink,
  renderSourceLines,
  sourceHashFromLocator,
  sourceLineScrollTop,
} from '../src/lib/source-viewer.js';

test('parseSourceHref reads source id and heading locator', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#heading=experiments'), {
    id: 'smith-2024',
    heading: 'experiments',
  });
});

test('parseSourceHref accepts bare heading fragments', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#4.1 Sub Title'), {
    id: 'smith-2024',
    heading: '4.1 Sub Title',
  });
});

test('parseSourceHref reads source id and line locator', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#lines=12-18'), {
    id: 'smith-2024',
    lines: { start: 12, end: 18 },
  });
});

test('parseSourceHref accepts compact line fragments', () => {
  assert.deepEqual(parseSourceHref('source:smith-2024#12-18'), {
    id: 'smith-2024',
    lines: { start: 12, end: 18 },
  });
  assert.deepEqual(parseSourceHref('source:smith-2024#L12-L18'), {
    id: 'smith-2024',
    lines: { start: 12, end: 18 },
  });
  assert.deepEqual(parseSourceHref('source:smith-2024#line=12'), {
    id: 'smith-2024',
    lines: { start: 12, end: 12 },
  });
});

test('parsed compact locators produce canonical source hashes', () => {
  assert.equal(sourceHashFromLocator(parseSourceHref('source:smith-2024#L12-L18')), '#source=smith-2024&lines=12-18');
  assert.equal(sourceHashFromLocator(parseSourceHref('source:smith-2024#4.1 Sub Title')), '#source=smith-2024&heading=4.1%20Sub%20Title');
});

test('source hashes preserve source id and locator details', () => {
  const hash = sourceHashFromLocator({ id: 'smith-2024', heading: 'experiment design' });

  assert.equal(hash, '#source=smith-2024&heading=experiment%20design');
  assert.deepEqual(parseSourceHash(hash), { id: 'smith-2024', heading: 'experiment design' });
});

test('parseSourceHash supports line locators and ignores unrelated hashes', () => {
  assert.deepEqual(parseSourceHash('#source=smith-2024&lines=120-138'), {
    id: 'smith-2024',
    lines: { start: 120, end: 138 },
  });
  assert.deepEqual(parseSourceHash('#source=smith-2024&line=L120'), {
    id: 'smith-2024',
    lines: { start: 120, end: 120 },
  });
  assert.equal(parseSourceHash('#section-heading'), undefined);
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

test('findHighlightLines accepts raw section headings and section numbers', () => {
  const lines = buildSourceLines('## 4\n\n### 4.1 Sub Title\nResult text');

  assert.deepEqual(findHighlightLines(lines, { heading: '4.1 Sub Title' }), { start: 3, end: 3 });
  assert.deepEqual(findHighlightLines(lines, { heading: '4.1' }), { start: 3, end: 3 });
});

test('sourceLineScrollTop centers highlighted lines inside the source panel', () => {
  assert.equal(sourceLineScrollTop({ clientHeight: 400 }, { offsetTop: 600, clientHeight: 24 }), 412);
  assert.equal(sourceLineScrollTop({ clientHeight: 400 }, { offsetTop: 80, clientHeight: 24 }), 0);
});

test('renderSourceLines shows a notice when a locator does not match', () => {
  const html = renderSourceLines({ body: '# Intro\n\nResult text' }, { heading: 'missing-heading' });

  assert.match(html, /No exact source location matched/);
  assert.doesNotMatch(html, /is-highlighted/);
});

test('pulseSourceLink toggles a temporary activation class', () => {
  const classes = new Set(['is-source-activated']);
  let cleanup;
  const link = {
    offsetWidth: 12,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };

  const timeoutId = pulseSourceLink(link, {
    setTimeoutFn: (callback, delay) => {
      cleanup = callback;
      assert.equal(delay, 520);
      return 7;
    },
  });

  assert.equal(timeoutId, 7);
  assert.equal(classes.has('is-source-activated'), true);
  cleanup();
  assert.equal(classes.has('is-source-activated'), false);
});
