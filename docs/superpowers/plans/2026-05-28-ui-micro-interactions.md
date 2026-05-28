# UI Micro-Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained UI micro-interactions to Quietstack's reading, navigation, search, archive, TOC, and source-viewer surfaces.

**Architecture:** Keep the implementation CSS-first inside the replaceable theme boundary. Use existing markup where possible, add only stable classes where selectors would otherwise be brittle, and preserve the static Astro content model, routes, search index, feeds, and publish API.

**Tech Stack:** Astro 6, CSS custom properties/keyframes, existing browser scripts for search/archive/source viewer, Node test runner.

---

### Task 1: Add Motion Tokens And Baseline Animations

**Files:**
- Modify: `src/themes/default/theme.css`

- [x] **Step 1: Add motion tokens near existing theme variables**

Add these variables inside the existing `:root` block:

```css
  --motion-fast: 140ms;
  --motion-base: 220ms;
  --motion-slow: 360ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
```

- [x] **Step 2: Add keyframes after the `:root` block**

Add:

```css
@keyframes quiet-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes quiet-soft-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.72;
  }
}
```

- [x] **Step 3: Apply entrance animation to primary layout sections**

Add a grouped rule:

```css
.hero__grid,
.listing-header,
.section,
.article__header,
.article__body {
  animation: quiet-fade-up var(--motion-slow) var(--ease-emphasized) both;
}
```

### Task 2: Add Navigation, Button, And Card Feedback

**Files:**
- Modify: `src/themes/default/theme.css`

- [x] **Step 1: Add transitions to navigation links and brand marks**

Update `.brand`, `.brand::before`, `.site-nav a`, `.site-nav__github`, `.site-footer__brand`, `.site-footer__brand::before`, and `.site-footer__nav a` with transitions for color, background, border, opacity, and transform where relevant. Keep dimensions stable.

- [x] **Step 2: Add button hover, focus, and active states**

Update `.button` so hover lifts by `translateY(-1px)`, active returns to neutral or slightly pressed, and focus-visible uses the existing accent ring style.

- [x] **Step 3: Add card hover and focus states**

Update `.card` so hover/focus-visible changes border color, shadow, and transform without changing layout. Add `:focus-visible` outline handling.

### Task 3: Refine Homepage Motion

**Files:**
- Modify: `src/themes/default/theme.css`

- [x] **Step 1: Animate the hero panel and code window**

Add transition and entrance timing to `.hero__panel` and `.code-window` so the panel appears with the hero but does not loop.

- [x] **Step 2: Stagger code-window dots**

Add `quiet-soft-pulse` to `.code-window__bar span` with small delay offsets:

```css
.code-window__bar span {
  animation: quiet-soft-pulse 2.8s var(--ease-standard) infinite;
}

.code-window__bar span:nth-child(2) {
  animation-delay: 160ms;
}

.code-window__bar span:nth-child(3) {
  animation-delay: 320ms;
}
```

- [x] **Step 3: Emphasize the accented code line**

Add a subtle text-shadow or color transition to `.code-line--accent`; do not add blinking or layout movement.

### Task 4: Add Search And Archive State Feedback

**Files:**
- Modify: `src/pages/search.astro`
- Modify: `src/themes/default/theme.css`

- [x] **Step 1: Replace inline search results margin with a class**

Change:

```astro
<div id="search-results" class="content-grid" style="margin-top: 1rem;"></div>
```

to:

```astro
<div id="search-results" class="content-grid search-results"></div>
```

- [x] **Step 2: Animate search result cards and empty states**

Add CSS for `.search-results`, `.search-results .card`, `.empty-state`, and `.content-grid > .empty-state` so newly rendered states fade up softly.

- [x] **Step 3: Add archive/search control transitions**

Update `.archive-controls select` and `.search-box` with border, box-shadow, background, and transform transitions. Add `:hover` and `:focus` states that do not alter dimensions.

### Task 5: Align TOC, Source Viewer, And Reduced Motion

**Files:**
- Modify: `src/themes/default/theme.css`
- Test: `tests/theme-css.test.mjs`

- [x] **Step 1: Align TOC transitions**

Update `.article-toc a` and `.article-toc a.is-active` so color, border, and background changes transition through the new motion tokens. Do not translate TOC links.

- [x] **Step 2: Align source viewer transitions**

Replace hardcoded source viewer transition timings with `--motion-slow`, `--motion-base`, and `--ease-emphasized`.

- [x] **Step 3: Add reduced-motion rules**

Add a reduced-motion block near the end of the file:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }

  .hero__grid,
  .listing-header,
  .section,
  .article__header,
  .article__body,
  .button,
  .card,
  .hero__panel,
  .source-viewer {
    transform: none !important;
  }
}
```

- [x] **Step 4: Preserve hidden UI states against component display rules**

Add this global hidden rule to `src/themes/default/theme.css`:

```css
[hidden] {
  display: none !important;
}
```

Add this regression test to `tests/theme-css.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('theme preserves hidden elements against component display rules', async () => {
  const css = await readFile(new URL('../src/themes/default/theme.css', import.meta.url), 'utf8');

  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});
```

### Task 6: Verify And Commit

**Files:**
- Verify all changed files

- [x] **Step 1: Run Astro diagnostics**

Run: `npm run check`

Expected: exit 0 and result shows `0 errors`, `0 warnings`, `0 hints`.

- [x] **Step 2: Run unit tests**

Run: `npm test`

Expected: exit 0 and all tests pass.

- [x] **Step 3: Run production build**

Run: `$env:ASTRO_TELEMETRY_DISABLED='1'; npm run build`

Expected: exit 0 and Pagefind emits `dist/pagefind/`.

- [x] **Step 4: Check whitespace**

Run: `git diff --check`

Expected: exit 0.

- [x] **Step 5: Review changed files**

Run: `git diff --stat` and inspect the CSS/search page diff.

Expected: only the plan, `src/pages/search.astro`, `src/themes/default/theme.css`, and `tests/theme-css.test.mjs` are changed for implementation.

- [ ] **Step 6: Commit implementation**

Run:

```sh
git add -f docs/superpowers/plans/2026-05-28-ui-micro-interactions.md
git add src/pages/search.astro src/themes/default/theme.css tests/theme-css.test.mjs
git commit -m "Add UI micro-interactions"
```

Expected: commit succeeds.
