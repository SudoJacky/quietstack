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
  assert.match(css, /\.article-toc__indicator\s*\{[^}]*top:\s*0;/s);
  assert.match(css, /\.article-toc a\.is-active\s*\{[^}]*background:\s*transparent;/s);
});

test('theme lets the posts discovery panel use the shell width', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');
  const discoveryPanel = css.match(/\.discovery-panel\s*\{(?<body>[^}]*)\}/s)?.groups?.body ?? '';

  assert.match(discoveryPanel, /width:\s*100%;/);
  assert.doesNotMatch(discoveryPanel, /max-width:\s*760px;/);
});

test('theme styles enhanced select popovers with the design surface system', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');

  assert.match(css, /\.custom-select__trigger\s*\{[^}]*border-radius:\s*8px;/s);
  assert.match(css, /\.custom-select__panel\s*\{[^}]*background:\s*var\(--surface-solid\);/s);
  assert.match(css, /\.custom-select__panel\s*\{[^}]*border:\s*1px solid var\(--border\);/s);
  assert.match(css, /\.custom-select__option\[aria-selected="true"\]\s*\{[^}]*background:\s*var\(--accent\);/s);
});

test('theme keeps listing popovers above archive content with compact archive spacing', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');
  const listingHeader = css.match(/\.listing-header\s*\{(?<body>[^}]*)\}/s)?.groups?.body ?? '';
  const compactListingHeader = css.match(/\.listing-header--compact\s*\{(?<body>[^}]*)\}/s)?.groups?.body ?? '';
  const archiveList = css.match(/\.archive-list\s*\{(?<body>[^}]*)\}/s)?.groups?.body ?? '';

  assert.match(listingHeader, /position:\s*relative;/);
  assert.match(listingHeader, /z-index:\s*4;/);
  assert.match(compactListingHeader, /padding-bottom:\s*0;/);
  assert.match(archiveList, /padding-top:\s*1rem;/);
});
