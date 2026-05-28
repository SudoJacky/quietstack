import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('theme preserves hidden elements against component display rules', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');

  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});
