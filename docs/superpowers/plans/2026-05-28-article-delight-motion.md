# Article Delight Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight article-page motion flourishes: a reading progress bar, smooth TOC indicator, and source-citation click pulse.

**Architecture:** Keep behavior local to article pages. Put pure calculations in `src/lib/article-motion.js`, reuse existing `ContentLayout.astro` article script, extend `src/lib/source-viewer.js` for source-link pulse, and style everything in the existing theme boundary with reduced-motion support.

**Tech Stack:** Astro 6, vanilla browser JavaScript, CSS custom properties/keyframes, Node test runner.

---

### Task 1: Article Motion Helpers

**Files:**
- Create: `src/lib/article-motion.js`
- Create: `tests/article-motion.test.mjs`

- [x] **Step 1: Write failing tests**

Create tests for progress clamping and TOC indicator geometry:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readingProgressRatio, tocIndicatorStyle } from '../src/lib/article-motion.js';

test('readingProgressRatio clamps document scroll progress', () => {
  assert.equal(readingProgressRatio({ scrollY: -20, viewportHeight: 400, documentHeight: 1200 }), 0);
  assert.equal(readingProgressRatio({ scrollY: 400, viewportHeight: 400, documentHeight: 1200 }), 0.5);
  assert.equal(readingProgressRatio({ scrollY: 1200, viewportHeight: 400, documentHeight: 1200 }), 1);
});

test('readingProgressRatio treats short documents as fully read', () => {
  assert.equal(readingProgressRatio({ scrollY: 0, viewportHeight: 900, documentHeight: 700 }), 1);
});

test('tocIndicatorStyle returns indicator geometry relative to the TOC container', () => {
  assert.deepEqual(tocIndicatorStyle({ linkTop: 148, containerTop: 120, linkHeight: 24 }), {
    top: '28px',
    height: '24px',
  });
});
```

- [x] **Step 2: Run tests and confirm RED**

Run: `node --test tests/article-motion.test.mjs`

Expected: fails because `src/lib/article-motion.js` does not exist.

- [x] **Step 3: Implement helpers**

Create `src/lib/article-motion.js`:

```js
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function readingProgressRatio({ scrollY = 0, viewportHeight = 0, documentHeight = 0 }) {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return 1;
  return clamp01(scrollY / scrollable);
}

export function tocIndicatorStyle({ linkTop = 0, containerTop = 0, linkHeight = 0 }) {
  return {
    top: `${Math.round(linkTop - containerTop)}px`,
    height: `${Math.round(linkHeight)}px`,
  };
}
```

- [x] **Step 4: Run tests and confirm GREEN**

Run: `node --test tests/article-motion.test.mjs`

Expected: all tests pass.

### Task 2: Source Link Pulse Helper

**Files:**
- Modify: `src/lib/source-viewer.js`
- Modify: `tests/source-viewer.test.mjs`

- [x] **Step 1: Write failing test**

Add this test to `tests/source-viewer.test.mjs`:

```js
test('pulseSourceLink toggles a temporary activation class', () => {
  const classes = new Set(['is-source-activated']);
  let cleanup;
  const link = {
    offsetWidth: 12,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };

  const timeoutId = pulseSourceLink(link, {
    setTimeoutFn: (callback, delay) => {
      cleanup = callback;
      assert.equal(delay, 520);
      return 7;
    },
  });

  assert.equal(timeoutId, 7);
  assert.equal(classes.has('is-source-activated'), true);
  cleanup();
  assert.equal(classes.has('is-source-activated'), false);
});
```

Also add `pulseSourceLink` to the import list.

- [x] **Step 2: Run test and confirm RED**

Run: `node --test tests/source-viewer.test.mjs`

Expected: fails because `pulseSourceLink` is not exported.

- [x] **Step 3: Implement helper and call it from source click handler**

Add to `src/lib/source-viewer.js`:

```js
export function pulseSourceLink(link, { className = 'is-source-activated', setTimeoutFn = globalThis.setTimeout } = {}) {
  if (!link?.classList) return undefined;

  link.classList.remove(className);
  void link.offsetWidth;
  link.classList.add(className);

  return setTimeoutFn(() => link.classList.remove(className), 520);
}
```

Call `pulseSourceLink(link);` after parsing a valid source locator and before opening the source.

- [x] **Step 4: Run test and confirm GREEN**

Run: `node --test tests/source-viewer.test.mjs`

Expected: all tests pass.

### Task 3: Wire Article Page Behavior

**Files:**
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/themes/default/theme.css`

- [x] **Step 1: Add article progress markup**

Inside `ContentLayout.astro`, add this before the `<article>`:

```astro
<div class="reading-progress" aria-hidden="true">
  <span data-reading-progress></span>
</div>
```

- [x] **Step 2: Add TOC indicator markup**

Inside `.article-toc`, before `<nav>`, add:

```astro
<span class="article-toc__indicator" data-toc-indicator hidden></span>
```

- [x] **Step 3: Update article script**

Import helpers:

```js
import { readingProgressRatio, tocIndicatorStyle } from '@/lib/article-motion.js';
```

Query the progress and indicator elements, then update them inside the existing scroll/resize loop:

```js
const progress = document.querySelector('[data-reading-progress]');
const tocIndicator = document.querySelector('[data-toc-indicator]');

function updateReadingProgress() {
  if (!(progress instanceof HTMLElement)) return;

  const ratio = readingProgressRatio({
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
  });
  progress.style.transform = `scaleX(${ratio})`;
}
```

Inside `updateActiveTocLink`, after toggling active classes, set the indicator based on the active entry:

```js
const activeEntry = tocEntries.find((entry) => entry.slug === activeSlug);
if (tocIndicator instanceof HTMLElement && activeEntry?.link instanceof HTMLElement) {
  const style = tocIndicatorStyle({
    linkTop: activeEntry.link.offsetTop,
    containerTop: 0,
    linkHeight: activeEntry.link.offsetHeight,
  });
  tocIndicator.style.setProperty('--toc-indicator-top', style.top);
  tocIndicator.style.setProperty('--toc-indicator-height', style.height);
  tocIndicator.hidden = false;
}
```

Call `updateReadingProgress()` on load and in `scheduleActiveTocLinkUpdate`.

- [x] **Step 4: Add CSS**

Add styles for `.reading-progress`, `.reading-progress span`, `.article-toc__indicator`, and `.article__body a[href^="source:"].is-source-activated`.

The source pulse should use a small keyframe sweep and should be disabled under existing reduced-motion rules.

### Task 4: Verify

**Files:**
- Verify all changed files

- [x] **Step 1: Run focused tests**

Run:

```sh
node --test tests/article-motion.test.mjs tests/source-viewer.test.mjs
```

Expected: all focused tests pass.

- [x] **Step 2: Run full checks**

Run:

```sh
npm run check
npm test
$env:ASTRO_TELEMETRY_DISABLED='1'; npm run build
git diff --check
```

Expected: all commands exit 0.

- [x] **Step 3: Browser verify**

Open `http://localhost:4322/posts/hello-quietstack/#static-output` and verify:

- top progress bar is visible and moves with scroll;
- TOC active indicator appears and follows active heading;
- clicking Source links opens the source viewer and briefly pulses the clicked link;
- no console errors except an existing favicon 404 if present.

- [x] **Step 4: Commit**

Run:

```sh
git add -f docs/superpowers/plans/2026-05-28-article-delight-motion.md
git add src/lib/article-motion.js src/lib/source-viewer.js src/layouts/ContentLayout.astro src/themes/default/theme.css tests/article-motion.test.mjs tests/source-viewer.test.mjs
git commit -m "Add article delight motion"
```
