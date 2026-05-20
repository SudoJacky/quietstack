import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const normalizeSite = (value) => value.replace(/\/+$/, '');
const normalizeBase = (value) => {
  if (!value || value === '/') return '/';
  const withLeading = value.startsWith('/') ? value : `/${value}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

export default defineConfig({
  output: 'static',
  site: normalizeSite(process.env.PUBLIC_SITE_URL ?? 'https://example.com'),
  base: normalizeBase(process.env.PUBLIC_BASE_PATH ?? '/'),
  integrations: [mdx()],
});
