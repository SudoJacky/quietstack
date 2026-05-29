# Content Discovery UX Design

## Goal

Improve the reader experience without changing the publishing curl/API workflow. The feature set should help visitors find relevant writing, continue reading after an article, jump around the site quickly, and resume articles locally across visits.

## Scope

This design includes four reader-facing enhancements:

1. Posts page filtering and quick search.
2. Article next/previous and related-reading navigation.
3. A keyboard command palette for fast site navigation.
4. Local reading state for read/continue affordances.

The implementation stays static-first. It must not introduce server-side state, authentication, databases, or any changes to the publish API.

## Current Context

Quietstack already has content collections for posts, notes, pages, and series. Search is static and Pagefind-backed in production, with a local static-search fallback in development. Article pages already have a left-side TOC, reading progress, and source-link viewer. Archive has type/tag filters, but `/posts/` is still a simple card grid.

## User Experience

### Posts Discovery

The `/posts/` page gets a compact discovery toolbar above the card grid:

- A keyword input filters visible post cards by title, description, tags, and year.
- Tag chips let readers narrow the list without navigating away.
- A year select supports broad date filtering.
- A small result count communicates how many posts match.
- An empty state appears when filters hide every post.

Cards remain normal links and continue using `ContentCard`. The filtering uses `data-*` attributes generated at build time, then vanilla JavaScript updates visibility.

### Article Continuation

Post article pages get a reading navigation block near the end of the article:

- Previous and next posts are based on reverse chronological post order.
- Related posts are ranked by shared tags, then by recency.
- The block hides subsections that have no data.

This gives readers a clear path after finishing an article without turning the page into a marketing layout.

### Command Palette

A small command palette opens with `Ctrl+K` / `Cmd+K` and an optional header button. It contains:

- Primary navigation entries: Posts, Notes, Archive, Search, About.
- Recent posts and notes.
- Client-side filtering by title/type/tags.

Selecting an item navigates to its URL. Escape closes the palette. The palette should be accessible: dialog role, labelled input, focus management, and keyboard selection.

### Local Reading State

Reading state is stored only in `localStorage`:

- Visiting a post stores `lastVisited`.
- Scrolling beyond a threshold stores reading progress and marks the post as read.
- Posts cards can show `Read` or `Continue` badges when local state exists.

No state is sent anywhere. If localStorage is unavailable, the site works normally with no badges.

## Architecture

Add small, focused helpers under `src/lib/`:

- `post-discovery.js`: normalize/filter post card metadata.
- `reading-navigation.js`: compute previous/next and related posts.
- `command-palette.js`: build/filter command entries and handle selection math.
- `reading-state.js`: read/write local reading state safely.

Astro pages produce structured static data and markup:

- `src/pages/posts/index.astro` renders discovery controls and card metadata.
- `src/pages/posts/[slug].astro` computes reading navigation data for `ContentLayout`.
- `ContentLayout.astro` renders optional continuation data and attaches article reading-state hooks.
- `BaseLayout.astro` or a shared component renders the command palette shell and data payload.

Use existing theme tokens in `src/themes/default/theme.css`. Keep controls dense and quiet; avoid landing-page hero treatment.

## Data Flow

Build time:

1. Astro loads visible posts/notes.
2. Pages render metadata into cards, navigation blocks, and command entries.
3. Static HTML is emitted.

Runtime:

1. Posts discovery filters already-rendered cards.
2. Command palette filters its static entry list.
3. Reading state updates localStorage and card badges.

## Error Handling

- Missing tags, dates, descriptions, or related posts should degrade by hiding optional UI.
- localStorage failures should be caught and ignored.
- Command palette should close cleanly on invalid selection or navigation.
- Filtering should never remove content from the DOM, only toggle visibility.

## Testing

Add Node tests for:

- Posts filter normalization and matching.
- Previous/next and related-post ranking.
- Command palette entry filtering and selection wrapping.
- Reading-state storage fallback and progress threshold behavior.

Verification commands:

- `npm run check`
- `npm test`
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`
- Browser checks for `/posts/`, one post page, and command palette keyboard flow.

## Out Of Scope

- Publishing curl/API workflow changes.
- Account sync or cross-device reading state.
- Server analytics.
- A full client-side router.
- Replacing Pagefind search.
