import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublicPosts, postUrl } from '@/lib/content';
import { site } from '@/lib/site';

export const GET: APIRoute = async (context) => {
  const posts = await getPublicPosts();

  return rss({
    title: site.name,
    description: site.description,
    site: context.site ?? new URL('https://example.com'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
    })),
  });
};
