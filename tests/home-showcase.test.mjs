import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeroStats, publishingFlowSteps, sourceShowcase } from '../src/lib/home-showcase.js';

test('buildHeroStats normalizes homepage content counts', () => {
  assert.deepEqual(buildHeroStats({ posts: [{ id: 'a' }, { id: 'b' }], notes: [{ id: 'n' }], sources: [] }), [
    { label: 'Posts', value: '2', tone: 'teal' },
    { label: 'Notes', value: '1', tone: 'amber' },
    { label: 'Sources', value: '0', tone: 'green' },
    { label: 'Search', value: 'Pagefind', tone: 'blue' },
  ]);

  assert.equal(buildHeroStats({})[0].value, '0');
});

test('publishingFlowSteps describes the static publishing pipeline in order', () => {
  assert.deepEqual(
    publishingFlowSteps.map((step) => step.label),
    ['Markdown', 'Collections', 'Source Citations', 'Pagefind', 'Static Deploy'],
  );
});

test('sourceShowcase keeps citation metadata and highlighted source lines together', () => {
  assert.equal(sourceShowcase.citation, 'source:quietstack-notes#lines=11');
  assert.equal(sourceShowcase.lines.some((line) => line.highlighted && line.number === 11), true);
  assert.match(sourceShowcase.command, /pagefind/i);
});
