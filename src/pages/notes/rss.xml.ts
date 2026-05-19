import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { formatDate, getPublicNotes, noteUrl } from '@/lib/content';
import { site } from '@/lib/site';

export const GET: APIRoute = async (context) => {
  const notes = await getPublicNotes();

  return rss({
    title: `${site.name} Notes`,
    description: 'Short-form notes from Quietstack.',
    site: context.site ?? new URL('https://example.com'),
    items: notes.map((note) => ({
      title: note.data.title ?? `Note ${formatDate(note.data.pubDate)}`,
      pubDate: note.data.pubDate,
      link: noteUrl(note),
    })),
  });
};
