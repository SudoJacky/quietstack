---
title: About
description: A short introduction and publishing guide for Quietstack.
draft: false
---

Quietstack is a small personal site for long-lived writing, short notes, and stable pages.

It is built as a provider-independent static artifact so it can be hosted anywhere that serves static websites.

## Publishing guide

Quietstack keeps each publishing format in a small content folder. Use the format that matches the shape of the writing rather than the length alone.

| Format | Folder | Best for |
| --- | --- | --- |
| Post | `src/content/posts/` | Long-form essays, tutorials, release notes, and durable articles. |
| Note | `src/content/notes/` | Short updates, quick references, snippets, and dated observations. |
| Page | `src/content/pages/` | Stable evergreen pages such as About, project docs, or publishing guides. |
| Series | `src/content/series/` | Ordered reading paths that group related posts. |

### Posts

Create posts as Markdown or MDX files in `src/content/posts/`. A post should include a title, description, publication date, tags, and draft state.

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

Use posts for content that should appear in the main publishing flow, RSS feed, archive, tag pages, and search index. Add `updatedDate` when an article receives a meaningful revision.

### Notes

Create notes in `src/content/notes/`. Notes only require a publication date; the title is optional because the site can derive a short title from the body.

```md
---
pubDate: 2026-05-20
tags: ["quietstack"]
draft: false
---

A short note can stay lightweight.
```

Use notes for small pieces that should still have stable URLs and RSS support, but do not need the heavier framing of a post.

### Pages

Create stable pages in `src/content/pages/`. Pages are routed from their filename, so `about.md` becomes `/about/`.

```md
---
title: About
description: A stable information page.
draft: false
---

Page content goes here.
```

Use pages for documentation, profile information, indexes, and other evergreen material that does not belong in the dated post or note streams.

### Series

Create series metadata as JSON files in `src/content/series/`. Use the series slug in post frontmatter to connect posts to that reading path.

```json
{
  "title": "Building Quietstack",
  "description": "Notes on building the site.",
  "draft": false
}
```

```md
---
title: Part one
description: The first article in a series.
pubDate: 2026-05-21
series: building-quietstack
tags: ["quietstack"]
draft: false
---
```

### Optional metadata

- `draft: true` keeps content visible in local development while excluding it from public production output.
- `cover` adds social and article imagery when a post or page needs a visual preview.
- `canonicalUrl` points search engines to an original source when content is syndicated.
- `searchText` adds extra hidden terms to the static search index.
- `discussionLinks` adds external discussion links to the article footer.

### Publishing workflow

1. Add or edit content in the right folder.
2. Keep frontmatter complete and use stable, lowercase filenames.
3. Run `npm run check` to validate Astro content and types.
4. Run `npm run build` to verify static output.
5. Preview locally before publishing the generated static artifact.
