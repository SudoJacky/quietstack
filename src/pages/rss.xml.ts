import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublicPosts, postPath } from '@/lib/content';
import { site } from '@/lib/site';
import { absoluteUrl } from '@/lib/url';

export const GET: APIRoute = async () => {
  const posts = await getPublicPosts();

  return rss({
    title: site.name,
    description: site.description,
    site: new URL(absoluteUrl('/')),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: absoluteUrl(postPath(post)),
    })),
  });
};
