import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Note = CollectionEntry<'notes'>;
export type Page = CollectionEntry<'pages'>;
export type Series = CollectionEntry<'series'>;

export type SearchItem = {
  type: 'post' | 'note';
  title: string;
  description?: string;
  url: string;
  date: string;
  tags: string[];
  body: string;
};

export const postUrl = (post: Post) => `/posts/${post.id}/`;
export const noteUrl = (note: Note) => `/notes/${note.id}/`;
export const pageUrl = (page: Page) => `/${page.id}/`;
export const tagUrl = (tag: string) => `/tags/${encodeURIComponent(tag)}/`;
export const seriesUrl = (seriesSlug: string) => `/series/${seriesSlug}/`;
export const noteTitle = (note: Note, length = 56) =>
  note.data.title ?? (note.body?.trim().replace(/\s+/g, ' ').slice(0, length) || 'Untitled note');

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

const byNewest = <T extends { data: { pubDate: Date } }>(a: T, b: T) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

export async function getPublicPosts() {
  return (await getCollection('posts')).filter((post) => !post.data.draft).sort(byNewest);
}

export async function getVisiblePosts() {
  return (await getCollection('posts')).filter((post) => import.meta.env.DEV || !post.data.draft).sort(byNewest);
}

export async function getPublicNotes() {
  return (await getCollection('notes')).filter((note) => !note.data.draft).sort(byNewest);
}

export async function getVisibleNotes() {
  return (await getCollection('notes')).filter((note) => import.meta.env.DEV || !note.data.draft).sort(byNewest);
}

export async function getPublicPages() {
  return (await getCollection('pages')).filter((page) => !page.data.draft);
}

export async function getVisiblePages() {
  return (await getCollection('pages')).filter((page) => import.meta.env.DEV || !page.data.draft);
}

export async function getPublicSeries() {
  return (await getCollection('series')).filter((item) => !item.data.draft);
}

export async function getAllTags() {
  const posts = await getPublicPosts();
  const notes = await getPublicNotes();
  return [...new Set([...posts.flatMap((post) => post.data.tags), ...notes.flatMap((note) => note.data.tags)])].sort(
    (a, b) => a.localeCompare(b),
  );
}

export async function getSearchItems(): Promise<SearchItem[]> {
  const posts = await getPublicPosts();
  const notes = await getPublicNotes();

  return [
    ...posts.map((post) => ({
      type: 'post' as const,
      title: post.data.title,
      description: post.data.description,
      url: postUrl(post),
      date: post.data.pubDate.toISOString(),
      tags: post.data.tags,
      body: post.body ?? '',
    })),
    ...notes.map((note) => ({
      type: 'note' as const,
      title: note.data.title ?? formatDate(note.data.pubDate),
      url: noteUrl(note),
      date: note.data.pubDate.toISOString(),
      tags: note.data.tags,
      body: note.body ?? '',
    })),
  ];
}
