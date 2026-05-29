# Content Discovery UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static-first reader UX for filtering posts, continuing article reading, opening a command palette, and showing local reading state.

**Architecture:** Keep pure behavior in small `src/lib/*.js` helpers with Node tests. Astro pages render static metadata into `data-*` attributes and small JSON payloads; browser scripts only filter existing DOM, navigate links, and persist local-only reading state.

**Tech Stack:** Astro 6, vanilla browser JavaScript, localStorage, Node test runner, existing CSS theme tokens.

---

### Task 1: Posts Discovery Helpers

**Files:**
- Create: `src/lib/post-discovery.js`
- Create: `tests/post-discovery.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `tests/post-discovery.test.mjs` with tests for normalized metadata and combined query/year/tag matching.

- [ ] **Step 2: Run RED**

Run `node --test tests/post-discovery.test.mjs`. Expected: module not found.

- [ ] **Step 3: Implement helper**

Create `src/lib/post-discovery.js` exporting:

```js
export const normalizeFilterValue = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();
export function postMatchesFilters(post, { query = '', tag = 'all', year = 'all' } = {}) { /* match title, description, tags, year */ }
export function filterPosts(posts, filters) { return posts.filter((post) => postMatchesFilters(post, filters)); }
```

- [ ] **Step 4: Run GREEN**

Run `node --test tests/post-discovery.test.mjs`. Expected: pass.

### Task 2: Article Continuation Helpers

**Files:**
- Create: `src/lib/reading-navigation.js`
- Create: `tests/reading-navigation.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests for previous/next by newest-first order and related posts by shared tag count, then recency.

- [ ] **Step 2: Run RED**

Run `node --test tests/reading-navigation.test.mjs`. Expected: module not found.

- [ ] **Step 3: Implement helper**

Create `src/lib/reading-navigation.js` exporting:

```js
export function adjacentPosts(posts, currentId) { /* previous newer, next older */ }
export function relatedPosts(posts, currentId, limit = 3) { /* score shared tags, sort score desc then date desc */ }
```

- [ ] **Step 4: Run GREEN**

Run `node --test tests/reading-navigation.test.mjs`. Expected: pass.

### Task 3: Command Palette Helpers

**Files:**
- Create: `src/lib/command-palette.js`
- Create: `tests/command-palette.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests for query matching across title/type/tags and keyboard selection wrapping.

- [ ] **Step 2: Run RED**

Run `node --test tests/command-palette.test.mjs`. Expected: module not found.

- [ ] **Step 3: Implement helper**

Create `src/lib/command-palette.js` exporting:

```js
export function filterCommandEntries(entries, query, limit = 12) { /* normalized contains match */ }
export function nextCommandIndex(current, direction, total) { /* wrap with -1 safe default */ }
```

- [ ] **Step 4: Run GREEN**

Run `node --test tests/command-palette.test.mjs`. Expected: pass.

### Task 4: Reading State Helpers

**Files:**
- Create: `src/lib/reading-state.js`
- Create: `tests/reading-state.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests for safe read/write with a fake storage object, unavailable storage fallback, and read threshold at 0.85.

- [ ] **Step 2: Run RED**

Run `node --test tests/reading-state.test.mjs`. Expected: module not found.

- [ ] **Step 3: Implement helper**

Create `src/lib/reading-state.js` exporting:

```js
export function readReadingState(storage = globalThis.localStorage) { /* object fallback */ }
export function writeReadingState(state, storage = globalThis.localStorage) { /* false on failure */ }
export function updateReadingEntry(state, slug, ratio, now = new Date()) { /* lastVisited, progress, read */ }
```

- [ ] **Step 4: Run GREEN**

Run `node --test tests/reading-state.test.mjs`. Expected: pass.

### Task 5: Wire Posts Discovery UI

**Files:**
- Modify: `src/components/ContentCard.astro`
- Modify: `src/pages/posts/index.astro`
- Modify: `src/themes/default/theme.css`

- [ ] **Step 1: Add post card metadata props**

Extend `ContentCard` to accept `searchText`, `year`, and `readingSlug`, then render `data-discovery-card`, `data-discovery-search`, `data-discovery-tags`, `data-discovery-year`, and optional reading badge.

- [ ] **Step 2: Add `/posts/` controls**

Render keyword input, tag buttons, year select, result count, empty state, and import `filterPosts`.

- [ ] **Step 3: Add browser script**

Read card metadata, call `filterPosts`, toggle `hidden`, update count/empty state, and apply local reading badges from `reading-state.js`.

- [ ] **Step 4: Add styles**

Add compact `.discovery-*` and `.reading-badge` styles using existing tokens.

### Task 6: Wire Article Continuation and Reading State

**Files:**
- Modify: `src/pages/posts/[slug].astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/themes/default/theme.css`

- [ ] **Step 1: Compute navigation data**

Use `adjacentPosts` and `relatedPosts` in `src/pages/posts/[slug].astro`, mapping results to serializable `{ href, title, description, date, tags }`.

- [ ] **Step 2: Extend layout props**

Add optional `readingNavigation` and `readingSlug` props to `ContentLayout.astro`.

- [ ] **Step 3: Render continuation block**

Render previous/next links and related cards near the article footer, hiding empty sections.

- [ ] **Step 4: Track reading state**

Attach `data-reading-slug` to article pages and update localStorage using `readingProgressRatio` plus `updateReadingEntry`.

### Task 7: Wire Command Palette

**Files:**
- Create: `src/components/CommandPalette.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/SiteNav.astro`
- Modify: `src/themes/default/theme.css`

- [ ] **Step 1: Create component**

Build command entries from routes, visible posts, and visible notes. Render dialog shell with input, result list, and JSON payload.

- [ ] **Step 2: Add layout component**

Import and render `CommandPalette` near the end of `body`.

- [ ] **Step 3: Add nav trigger**

Add a small `Search`/`⌘K` trigger button in `SiteNav` without breaking existing links.

- [ ] **Step 4: Add client script**

Open with button or `Ctrl/Cmd+K`, filter entries, support ArrowUp/ArrowDown/Enter/Escape, and navigate on selection.

- [ ] **Step 5: Add styles**

Add modal/backdrop/list styles and mobile-safe sizing.

### Task 8: Verify and Commit

**Files:**
- All changed files

- [ ] **Step 1: Focused tests**

Run:

```sh
node --test tests/post-discovery.test.mjs tests/reading-navigation.test.mjs tests/command-palette.test.mjs tests/reading-state.test.mjs tests/theme-css.test.mjs
```

- [ ] **Step 2: Full checks**

Run:

```sh
npm run check
npm test
$env:ASTRO_TELEMETRY_DISABLED='1'; npm run build
git diff --check
```

- [ ] **Step 3: Browser checks**

Verify `/posts/` filtering, a post article continuation block, command palette keyboard flow, and local reading badge updates.

- [ ] **Step 4: Commit**

Stage only project files and commit:

```sh
git add -f docs/superpowers/plans/2026-05-29-content-discovery-ux.md
git add src tests
git commit -m "Add content discovery UX"
```
