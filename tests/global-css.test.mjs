import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('global layout keeps footer at the bottom of short pages', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

  assert.match(css, /body\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*min-height:\s*100vh;/s);
  assert.match(css, /main\s*\{[^}]*flex:\s*1 0 auto;/s);
});
