---
title: About
description: Quietstack publishing and source citation guide.
draft: false
---

Quietstack is a static publishing system for posts, notes, pages, source documents, and attachments. It can be edited from the repository, or updated remotely through a small REST API when SSH access is unavailable.

## Service modes

Use the standard commands when working locally:

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Use the publishing service when a server should accept remote uploads and rebuild the static site automatically:

```sh
npm run serve:publish -- --host 0.0.0.0 --api-host 0.0.0.0
```

Enable bearer-token authentication with `--auth` and `PUBLISH_API_TOKEN`:

```sh
$env:PUBLISH_API_TOKEN = "replace-me"
npm run serve:publish -- --host 0.0.0.0 --api-host 0.0.0.0 --auth
```

`serve:publish` starts both parts of the service:

| Process | Purpose |
| --- | --- |
| `preview:watch` | Builds `dist/`, builds `dist/pagefind/`, serves the static output, and rebuilds when source files change. |
| `publish-api` | Accepts Markdown, MDX, and attachment uploads over HTTP. |

Run the two processes separately only when process supervision needs separate logs or restart policies:

```sh
npm run preview:watch -- --host 0.0.0.0
npm run publish-api -- --host 0.0.0.0 --auth
```

## Content folders

Quietstack keeps each content type in a dedicated folder.

| Type | Folder | Route or use |
| --- | --- | --- |
| Posts | `src/content/posts/` | `/posts/{slug}/` |
| Notes | `src/content/notes/` | `/notes/{slug}/` |
| Pages | `src/content/pages/` | `/{slug}/` |
| Sources | `src/content/sources/` | In-article source viewer data |
| Series | `src/content/series/` | Ordered post groups |
| Attachments | `public/attachments/` | Static files such as PDFs and images |

Posts, notes, pages, and sources are Markdown or MDX files. Attachments are served as static files and are not rendered as content pages.

## REST API

All upload endpoints accept `multipart/form-data` with a single `file` field. When `--auth` is enabled, include:

```sh
-H "Authorization: Bearer replace-me"
```

Upload a post:

```sh
curl -X POST http://server:8787/api/content/posts -H "Authorization: Bearer replace-me" -F "file=@hello-world.md"
```

Upload a source document converted from a paper:

```sh
curl -X POST http://server:8787/api/content/sources -H "Authorization: Bearer replace-me" -F "file=@smith-2024-paper.md"
```

Upload a PDF attachment for a post:

```sh
curl -X POST http://server:8787/api/attachments/posts/hello-world -H "Authorization: Bearer replace-me" -F "file=@smith-2024-paper.pdf"
```

The content upload API writes to `src/content/{posts,notes,pages,sources}/`. The attachment API writes to `public/attachments/{posts,notes,pages}/{slug}/`.

## Posts

Create posts in `src/content/posts/`. A post should include a title, description, publication date, tags, and draft state.

```md
---
title: Hello Quietstack
description: The first long-form post in this static personal publishing site.
pubDate: 2026-05-19
tags: ["astro", "quietstack"]
draft: false
---

Write the article body here.
```

Use posts for long-form writing that should appear in the main publishing flow, RSS feed, archive, tag pages, search index, and Pagefind index. Add `updatedDate` when an article receives a meaningful revision.

## Sources and citations

Use sources for paper excerpts, PDF-to-Markdown conversions, research notes, transcripts, or any supporting material that should appear inside the article page when a reader clicks a citation.

Create a source document in `src/content/sources/`:

```md
---
title: Smith 2024 Paper
description: Markdown conversion of the original PDF.
draft: false
---

# Smith 2024 Paper

## Experiments

The experimental setup is described here.
```

Connect a post to the source through `references`:

```md
---
title: Article using a paper
description: Example article.
pubDate: 2026-05-28
tags: ["research"]
draft: false
references:
  - id: smith-2024
    source: smith-2024-paper
    title: Smith 2024 Paper
---
```

Then cite the source in the article body:

```md
The result follows the experiment design. [Source](source:smith-2024#heading=experiments)

The key conclusion appears in a specific range. [Source lines](source:smith-2024#lines=120-138)
```

Clicking either link opens the source viewer from the right side of the article. The viewer highlights the requested heading or line range and can scroll independently from the article.

Source documents may be uploaded after the post is published. If a referenced source is missing or still marked as draft, the production build continues and the citation remains in the article, but the source viewer has no data for that citation until the source is uploaded and published.

## PDF attachments

PDFs should be uploaded as attachments, not placed in `src/content/sources/`. The source Markdown belongs in `src/content/sources/`; the original PDF belongs under `public/attachments/...`.

For a post with slug `hello-world`, upload the PDF to:

```text
public/attachments/posts/hello-world/smith-2024-paper.pdf
```

Then expose it in the source viewer by adding `pdf` to the source frontmatter:

```md
---
title: Smith 2024 Paper
pdf: /attachments/posts/hello-world/smith-2024-paper.pdf
draft: false
---
```

Only configure `pdf` when that static file actually exists. If `pdf` is omitted, the source viewer hides the `Open PDF` button.

## Notes, pages, and series

Notes live in `src/content/notes/` and only require a publication date:

```md
---
pubDate: 2026-05-20
tags: ["quietstack"]
draft: false
---

A short note can stay lightweight.
```

Pages live in `src/content/pages/`; `about.md` becomes `/about/`.

```md
---
title: About
description: A stable information page.
draft: false
---
```

Series metadata lives in `src/content/series/`:

```json
{
  "title": "Building Quietstack",
  "description": "Notes on building the site.",
  "draft": false
}
```

Posts join a series with `series: building-quietstack`.

## Validation checklist

Before publishing, verify:

1. Markdown frontmatter is complete.
2. `references[].source` points to an existing file in `src/content/sources/` when source viewer data should be available immediately.
3. `pdf` paths point to existing files under `public/attachments/`.
4. Internal links are relative unless they intentionally point to static attachments.
5. `npm run check` and `npm run build` pass.
