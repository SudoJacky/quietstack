import assert from 'node:assert/strict';
import test from 'node:test';
import { readReadingState, updateReadingEntry, writeReadingState } from '../src/lib/reading-state.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('readReadingState returns stored object data', () => {
  const storage = createStorage({
    quietstackReadingState: JSON.stringify({ posts: { hello: { read: true } } }),
  });

  assert.deepEqual(readReadingState(storage), { posts: { hello: { read: true } } });
});

test('writeReadingState stores JSON and reports success', () => {
  const storage = createStorage();

  assert.equal(writeReadingState({ posts: { hello: { read: true } } }, storage), true);
  assert.deepEqual(readReadingState(storage), { posts: { hello: { read: true } } });
});

test('reading state helpers tolerate unavailable storage', () => {
  const storage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  assert.deepEqual(readReadingState(storage), { posts: {} });
  assert.equal(writeReadingState({ posts: {} }, storage), false);
});

test('updateReadingEntry records progress and read threshold', () => {
  const now = new Date('2026-05-29T12:00:00.000Z');
  const state = updateReadingEntry({ posts: {} }, 'hello', 0.9, now);

  assert.deepEqual(state.posts.hello, {
    lastVisited: '2026-05-29T12:00:00.000Z',
    progress: 0.9,
    read: true,
  });
});
