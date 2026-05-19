# Quietstack

Quietstack is a static content-first personal blog built with Astro, Markdown/MDX, and a replaceable custom theme boundary.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

Set `PUBLIC_SITE_URL` before production builds when RSS links should use your real domain:

```sh
$env:PUBLIC_SITE_URL = "https://example.com"
npm run build
```

## Content

- Posts live in `src/content/posts/`
- Notes live in `src/content/notes/`
- Pages live in `src/content/pages/`
- Series metadata lives in `src/content/series/`

Posts publish to `/posts/{slug}/`, Notes publish to `/notes/{slug}/`, Pages publish to `/{slug}/`, and the build output in `dist/` is provider-independent static HTML/CSS/JS.

## Theme Boundary

Theme styles live under `src/themes/`. The initial style is Apple-inspired, but content collections, routes, RSS, and search should stay stable when a new visual style replaces it.
