import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('theme preserves hidden elements against component display rules', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');

  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});

test('theme keeps the article TOC indicator in a separate gutter', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');

  assert.match(css, /\.article-toc\s*\{[^}]*padding-left:\s*0\.9rem;/s);
  assert.match(css, /\.article-toc::before\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--border\) 72%,\s*transparent\);/s);
  assert.match(css, /\.article-toc a\.is-active\s*\{[^}]*background:\s*transparent;/s);
});
