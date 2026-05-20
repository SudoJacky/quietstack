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

For subpath hosting, keep the origin and base path separate:

```sh
$env:PUBLIC_SITE_URL = "https://sudojacky.github.io"
$env:PUBLIC_BASE_PATH = "/quietstack"
npm run build
```

For root hosting, omit `PUBLIC_BASE_PATH` or set it to `/`. Generated navigation, feeds, canonical URLs, search fetches, and sitemaps should all use the configured base path.

When writing Markdown or MDX, prefer relative links for internal content. Avoid root-absolute internal links such as `/posts/example/`, because they bypass the deployment base path.

## Content

- Posts live in `src/content/posts/`
- Notes live in `src/content/notes/`
- Pages live in `src/content/pages/`
- Series metadata lives in `src/content/series/`

Posts publish to `/posts/{slug}/`, Notes publish to `/notes/{slug}/`, Pages publish to `/{slug}/`, and the build output in `dist/` is provider-independent static HTML/CSS/JS.

Posts and Pages can define a static social image:

```yaml
cover:
  image: "/social/default.svg"
  alt: "A quiet editorial preview image"
```

If a cover is omitted, the site default social image is used.

## Theme Boundary

Theme styles live under `src/themes/`. The initial style is Apple-inspired, but content collections, routes, RSS, and search should stay stable when a new visual style replaces it.
