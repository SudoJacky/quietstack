# Quietstack

Quietstack is a static content-first personal blog built with Astro, Markdown/MDX, and a replaceable custom theme boundary.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
npm run preview:watch
npm run publish-api
npm run serve:publish
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

## Publish API

Use the publish API when the server cannot be accessed over SSH but should accept content uploads:

```sh
npm run serve:publish -- --host 0.0.0.0 --api-host 0.0.0.0
```

Enable bearer-token authentication with `--auth` and `PUBLISH_API_TOKEN`:

```sh
$env:PUBLISH_API_TOKEN = "replace-me"
npm run serve:publish -- --host 0.0.0.0 --api-host 0.0.0.0 --auth
```

Upload a Markdown or MDX file with curl:

```sh
curl -X POST http://server:8787/api/content/posts -H "Authorization: Bearer replace-me" -F "file=@hello-world.md"
curl -X POST http://server:8787/api/content/sources -H "Authorization: Bearer replace-me" -F "file=@smith-2024-paper.md"
curl -X POST http://server:8787/api/attachments/posts/hello-world -H "Authorization: Bearer replace-me" -F "file=@smith-2024-paper.pdf"
```

The API writes files under `src/content/{posts,notes,pages,sources}/`. The `serve:publish` command also starts the build watcher, so changed content rebuilds `dist/` and `dist/pagefind/`.
Attachments are written under `public/attachments/{posts,notes,pages}/{slug}/`.

Source documents live under `src/content/sources/` and can be cited from posts with source links:

```md
[Source](source:smith-2024#heading=experiments)
[Source lines](source:smith-2024#lines=120-138)
```

Posts connect source links to source documents through frontmatter:

```yaml
references:
  - id: smith-2024
    source: smith-2024-paper
    title: Smith 2024 paper
```

Source documents can be uploaded after the post. A missing or draft source does not block the production build; the citation remains a normal link target until the source viewer data is available.

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
