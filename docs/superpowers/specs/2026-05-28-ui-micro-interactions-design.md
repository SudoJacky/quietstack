# Quietstack UI Micro-Interactions Design

## Goal

Add restrained UI motion that makes Quietstack feel more polished without changing the content model, route structure, publishing flow, feeds, search indexing, or theme boundary.

The motion should support reading and navigation. It should not turn the site into a landing page, distract from long-form content, or depend on a runtime service.

## Scope

In scope:

- Page-level entrance motion for primary content areas.
- Soft hover and focus transitions for navigation, buttons, cards, archive controls, search input, and tag pills.
- Slight homepage hero/code-window motion that stays quiet and text-led.
- Search and archive result transitions when content appears, filters, or changes state.
- Existing source viewer and table-of-contents transitions refined for consistency.
- `prefers-reduced-motion: reduce` support that disables non-essential movement while preserving opacity/color state changes where useful.

Out of scope:

- Route transitions that require a client-side router.
- New content schema fields.
- New routes or discovery features.
- Heavy scroll-jacking, parallax, decorative blobs, full-screen hero redesigns, or animation libraries.
- Changes to Pagefind, RSS, sitemap, content validation, or publish API behavior.

## Design Direction

Use a restrained reading-product motion style:

- Durations should mostly stay between 140ms and 360ms.
- Movement should be small: 2-10px translation, subtle scale, or opacity.
- Hover should communicate clickability without causing layout shift.
- Focus states must remain visible and accessible.
- Motion should be implemented with CSS first. Use small page-local scripts only where the state already exists, such as search result rendering or archive filtering.

## Interaction Details

### Global Motion Tokens

Add CSS custom properties to the theme:

- `--motion-fast`
- `--motion-base`
- `--motion-slow`
- `--ease-standard`
- `--ease-emphasized`

Use these tokens in existing components so future theme styles can replace the feel without searching for many hardcoded transitions.

### Page Entrances

Apply a gentle entrance to:

- `.hero__grid`
- `.listing-header`
- `.section`
- `.article__header`
- `.article__body`

The animation should combine opacity with a small downward-to-neutral movement. It should run once on load and not require JavaScript.

### Cards, Buttons, and Links

Cards should gain a small lift, border-color shift, and shadow change on hover/focus-visible. Buttons should use a slight lift on hover and a pressed state on active. Navigation links should receive a calm underline or color transition instead of jumping layout.

All of these must avoid changing element dimensions.

### Homepage Hero

The code-window panel should feel lightly alive:

- The panel can float in with the page entrance.
- The three window dots can softly stagger on load.
- The accented code line can receive a subtle emphasis without blinking.

This must stay decorative and stop under reduced motion.

### Search and Archive States

Search results already render dynamically. Add a result-list class and use CSS animation for newly rendered cards. The empty/loading/unavailable state can fade in.

Archive filtering currently toggles `hidden`. Keep that behavior, but add a transition-friendly class before hiding only if it stays simple and testable. If that adds unnecessary complexity, restrict the implementation to controls, cards, and empty-state transitions.

### Source Viewer and TOC

Keep the existing source viewer slide behavior, but align its duration/easing with the new motion tokens.

TOC active state should transition border, background, and color. It should not move the active item because it is a reading aid.

## Accessibility

Add a `@media (prefers-reduced-motion: reduce)` block that:

- Sets animation duration to near-zero.
- Disables transforms for entrance, hover lift, source viewer slide, and code-window decorative motion.
- Keeps focus-visible styling clear.

No animation should be required to understand page state.

## Implementation Plan

1. Add motion tokens and reduced-motion rules to `src/themes/default/theme.css`.
2. Add CSS transitions/animations to existing classes for global entrance, cards, buttons, nav, search, archive controls, TOC, and source viewer.
3. Add minimal class/data hooks only where existing markup lacks a stable selector.
4. Run `npm run check`, `npm test`, and `npm run build`.
5. Manually inspect the built site or dev server at desktop and mobile widths for layout shift, text overlap, and reduced-motion behavior.

## Testing Strategy

Automated:

- `npm run check`
- `npm test`
- `npm run build`

Manual:

- Home page: hero entrance, card hover, button hover/active.
- Archive page: select controls, filtered cards, empty state.
- Search page: typing, loading state, result appearance, no-results state.
- Post page: TOC active state and source viewer open/close.
- Browser or OS reduced-motion mode, if available.

## Commit Description

Add restrained UI micro-interactions for reading and discovery surfaces.
