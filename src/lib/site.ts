import { withBase } from './url';

export const site = {
  name: 'Quietstack',
  description: 'A static content-first personal blog for long-lived writing.',
  author: 'Quietstack',
  language: 'zh-CN',
  defaultSocialImage: '/social/default.svg',
};

export const paths = {
  home: '/',
  posts: '/posts/',
  notes: '/notes/',
  archive: '/archive/',
  search: '/search/',
  tags: '/tags/',
  series: '/series/',
  mainFeed: '/rss.xml',
  notesFeed: '/notes/rss.xml',
};

export const routes = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, withBase(path)])) as typeof paths;
