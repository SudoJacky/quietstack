import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

test('package scripts expose test and verify commands', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.scripts.test, 'node --test tests/*.test.mjs');
  assert.equal(packageJson.scripts['verify:builds'], 'node scripts/verify-builds.mjs');
  assert.equal(packageJson.scripts.verify, 'npm run check && npm test && npm run verify:builds');
});
