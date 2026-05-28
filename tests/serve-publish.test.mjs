import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCliArgs } from '../scripts/serve-publish.mjs';

test('parseCliArgs splits preview and publish API arguments', () => {
  assert.deepEqual(parseCliArgs([]), {
    previewArgs: [],
    publishArgs: [],
  });

  assert.deepEqual(parseCliArgs(['--host', '0.0.0.0', '--port', '4321', '--api-host', '127.0.0.1', '--api-port', '8787', '--auth']), {
    previewArgs: ['--host', '0.0.0.0', '--port', '4321'],
    publishArgs: ['--host', '127.0.0.1', '--port', '8787', '--auth'],
  });
});
