import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/lib/url';
import { formatDate, getPublicNotes, notePath } from '@/lib/content';
import { site } from '@/lib/site';

export const GET: APIRoute = async () => {
  const notes = await getPublicNotes();

  return rss({
    title: `${site.name} Notes`,
    description: 'Short-form notes from Quietstack.',
    site: new URL(absoluteUrl('/')),
    items: notes.map((note) => ({
      title: note.data.title ?? `Note ${formatDate(note.data.pubDate)}`,
      pubDate: note.data.pubDate,
      link: absoluteUrl(notePath(note)),
    })),
  });
};
