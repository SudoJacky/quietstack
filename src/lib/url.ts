const normalizeOrigin = (value: string) => value.replace(/\/+$/, '');

const normalizeBasePath = (value: string) => {
  if (!value || value === '/') return '/';
  const withLeading = value.startsWith('/') ? value : `/${value}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

export const siteOrigin = normalizeOrigin(import.meta.env.PUBLIC_SITE_URL ?? 'https://example.com');
export const basePath = normalizeBasePath(import.meta.env.BASE_URL ?? '/');

export const normalizePath = (path: string) => {
  if (!path || path === '/') return '/';
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.endsWith('/') || withLeading.includes('.') ? withLeading : `${withLeading}/`;
};

export const withBase = (path: string) => {
  const normalizedPath = normalizePath(path);
  if (basePath === '/') return normalizedPath;
  return `${basePath.replace(/\/$/, '')}${normalizedPath}`;
};

export const absoluteUrl = (path: string) => new URL(withBase(path), `${siteOrigin}/`).toString();

export const assetUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/')) return absoluteUrl(path);
  return absoluteUrl(`/${path}`);
};

export const encodeSlug = (value: string) => encodeURIComponent(value);
