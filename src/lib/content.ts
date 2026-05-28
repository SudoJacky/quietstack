import { getCollection, type CollectionEntry } from 'astro:content';
import { encodeSlug, withBase } from './url';
import { validateContentIntegrity } from './validation';

export type Post = CollectionEntry<'posts'>;
export type Note = CollectionEntry<'notes'>;
export type Page = CollectionEntry<'pages'>;
export type Series = CollectionEntry<'series'>;
export type Source = CollectionEntry<'sources'>;

export type SearchItem = {
  type: 'post' | 'note';
  title: string;
  description?: string;
  excerpt?: string;
  url: string;
  date: string;
  tags: string[];
  searchText?: string;
};

const fencedCodePattern = /```[^\n]*\n([\s\S]*?)```/g;
const markdownStructuralPattern = /`([^`]+)`|!\[([^\]]*)\]\([^)]+\)|\[([^\]]+)\]\([^)]+\)|[#>*_~`|\\[\]()-]/g;

export const postPath = (post: Post) => `/posts/${post.id}/`;
export const notePath = (note: Note) => `/notes/${note.id}/`;
export const pagePath = (page: Page) => `/${page.id}/`;
export const tagPath = (tag: string) => `/tags/${encodeSlug(tag)}/`;
export const seriesPath = (seriesSlug: string) => `/series/${seriesSlug}/`;

export const postUrl = (post: Post) => withBase(postPath(post));
export const noteUrl = (note: Note) => withBase(notePath(note));
export const pageUrl = (page: Page) => withBase(pagePath(page));
export const tagUrl = (tag: string) => withBase(tagPath(tag));
export const seriesUrl = (seriesSlug: string) => withBase(seriesPath(seriesSlug));

export const noteTitle = (note: Note, length = 56) =>
  note.data.title ?? (note.body?.trim().replace(/\s+/g, ' ').slice(0, length) || 'Untitled note');

export const excerptFromBody = (body: string | undefined, length = 160) => {
  const text = body?.trim().replace(/\s+/g, ' ') ?? '';
  if (text.length <= length) return text;
  return `${text.slice(0, length - 3).trim()}...`;
};

export const searchTextFromBody = (body: string | undefined) =>
  body
    ?.replace(fencedCodePattern, '$1')
    ?.replace(markdownStructuralPattern, (_match, codeText, imageAlt, linkText) => codeText ?? imageAlt ?? linkText ?? ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const combinedSearchText = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ').trim() || undefined;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

const byNewest = <T extends { data: { pubDate: Date } }>(a: T, b: T) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

export async function getPublicPosts() {
  await validateContentIntegrity();
  return (await getCollection('posts')).filter((post) => !post.data.draft).sort(byNewest);
}

export async function getVisiblePosts() {
  await validateContentIntegrity();
  return (await getCollection('posts')).filter((post) => import.meta.env.DEV || !post.data.draft).sort(byNewest);
}

export async function getPublicNotes() {
  await validateContentIntegrity();
  return (await getCollection('notes')).filter((note) => !note.data.draft).sort(byNewest);
}

export async function getVisibleNotes() {
  await validateContentIntegrity();
  return (await getCollection('notes')).filter((note) => import.meta.env.DEV || !note.data.draft).sort(byNewest);
}

export async function getPublicPages() {
  await validateContentIntegrity();
  return (await getCollection('pages')).filter((page) => !page.data.draft);
}

export async function getVisiblePages() {
  await validateContentIntegrity();
  return (await getCollection('pages')).filter((page) => import.meta.env.DEV || !page.data.draft);
}

export async function getPublicSeries() {
  await validateContentIntegrity();
  return (await getCollection('series')).filter((item) => !item.data.draft);
}

export async function getVisibleSources() {
  await validateContentIntegrity();
  return (await getCollection('sources')).filter((source) => import.meta.env.DEV || !source.data.draft);
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
      excerpt: excerptFromBody(post.body),
      url: postUrl(post),
      date: post.data.pubDate.toISOString(),
      tags: post.data.tags,
      searchText: combinedSearchText(post.data.searchText, searchTextFromBody(post.body)),
    })),
    ...notes.map((note) => ({
      type: 'note' as const,
      title: note.data.title ?? formatDate(note.data.pubDate),
      excerpt: excerptFromBody(note.body),
      url: noteUrl(note),
      date: note.data.pubDate.toISOString(),
      tags: note.data.tags,
      searchText: combinedSearchText(note.data.searchText, searchTextFromBody(note.body)),
    })),
  ];
}
