import assert from 'node:assert/strict';
import test from 'node:test';
import { readingProgressRatio, tocIndicatorStyle } from '../src/lib/article-motion.js';

test('readingProgressRatio clamps document scroll progress', () => {
  assert.equal(readingProgressRatio({ scrollY: -20, viewportHeight: 400, documentHeight: 1200 }), 0);
  assert.equal(readingProgressRatio({ scrollY: 400, viewportHeight: 400, documentHeight: 1200 }), 0.5);
  assert.equal(readingProgressRatio({ scrollY: 1200, viewportHeight: 400, documentHeight: 1200 }), 1);
});

test('readingProgressRatio treats short documents as fully read', () => {
  assert.equal(readingProgressRatio({ scrollY: 0, viewportHeight: 900, documentHeight: 700 }), 1);
});

test('tocIndicatorStyle returns indicator geometry relative to the TOC container', () => {
  assert.deepEqual(tocIndicatorStyle({ linkTop: 148, containerTop: 120, linkHeight: 24 }), {
    top: '28px',
    height: '24px',
  });
});
