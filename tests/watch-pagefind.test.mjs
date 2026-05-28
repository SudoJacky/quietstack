import assert from 'node:assert/strict';
import test from 'node:test';
import { createRebuildQueue, parseCliArgs, shouldWatchPath } from '../scripts/watch-pagefind.mjs';

test('shouldWatchPath keeps source and public inputs that can affect dist', () => {
  assert.equal(shouldWatchPath('src/content/posts/example.md'), true);
  assert.equal(shouldWatchPath('public/social/default.svg'), true);
  assert.equal(shouldWatchPath('astro.config.mjs'), true);
});

test('shouldWatchPath ignores generated output and dependencies', () => {
  assert.equal(shouldWatchPath('dist/pagefind/pagefind.js'), false);
  assert.equal(shouldWatchPath('node_modules/astro/index.js'), false);
  assert.equal(shouldWatchPath('.git/index'), false);
});

test('createRebuildQueue coalesces changes and reruns after active rebuilds', async () => {
  let resolveFirstRun;
  const runs = [];
  const queue = createRebuildQueue({
    debounceMs: 0,
    logger: { log() {}, error() {} },
    run: async (reason) => {
      runs.push(reason);
      if (runs.length === 1) {
        await new Promise((resolve) => {
          resolveFirstRun = resolve;
        });
      }
    },
  });

  queue.schedule('first.md');
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(runs, ['first.md']);

  queue.schedule('second.md');
  queue.schedule('third.md');
  resolveFirstRun();
  await queue.waitForIdle();

  assert.deepEqual(runs, ['first.md', 'third.md']);
});

test('parseCliArgs enables preview mode and passes through preview arguments', () => {
  assert.deepEqual(parseCliArgs([]), { preview: false, previewArgs: [] });
  assert.deepEqual(parseCliArgs(['--preview', '--host', '0.0.0.0']), {
    preview: true,
    previewArgs: ['--host', '0.0.0.0'],
  });
});
