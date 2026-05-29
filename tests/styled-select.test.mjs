import test from 'node:test';
import assert from 'node:assert/strict';

import { nextOptionIndex, optionEntriesFromSelect, selectedOptionIndex } from '../src/lib/styled-select.js';

test('optionEntriesFromSelect reads labels, values, selected state, and disabled state', () => {
  const select = {
    options: [
      { value: 'all', textContent: 'All years', selected: true, disabled: false },
      { value: '2026', textContent: '2026', selected: false, disabled: false },
      { value: '2023', textContent: '2023', selected: false, disabled: true },
    ],
  };

  assert.deepEqual(optionEntriesFromSelect(select), [
    { value: 'all', label: 'All years', selected: true, disabled: false, index: 0 },
    { value: '2026', label: '2026', selected: false, disabled: false, index: 1 },
    { value: '2023', label: '2023', selected: false, disabled: true, index: 2 },
  ]);
});

test('selectedOptionIndex prefers the matching value and falls back to selected entry', () => {
  const entries = [
    { value: 'all', label: 'All years', selected: true, disabled: false, index: 0 },
    { value: '2026', label: '2026', selected: false, disabled: false, index: 1 },
  ];

  assert.equal(selectedOptionIndex(entries, '2026'), 1);
  assert.equal(selectedOptionIndex(entries, 'missing'), 0);
});

test('nextOptionIndex wraps and skips disabled options', () => {
  const entries = [
    { value: 'all', label: 'All years', selected: true, disabled: false, index: 0 },
    { value: '2026', label: '2026', selected: false, disabled: true, index: 1 },
    { value: '2023', label: '2023', selected: false, disabled: false, index: 2 },
  ];

  assert.equal(nextOptionIndex(entries, 0, 1), 2);
  assert.equal(nextOptionIndex(entries, 2, 1), 0);
  assert.equal(nextOptionIndex(entries, 0, -1), 2);
});
