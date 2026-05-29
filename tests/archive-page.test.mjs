import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('archive page uses compact listing header spacing for filter controls', async () => {
  const page = await readFile(new URL('../src/pages/archive.astro', import.meta.url), 'utf8');

  assert.match(page, /class="shell listing-header listing-header--compact"/);
});
