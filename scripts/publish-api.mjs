import { createServer } from 'node:http';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const allowedCollections = new Set(['posts', 'notes', 'pages', 'sources']);
const allowedExtensions = new Set(['.md', '.mdx']);
const allowedAttachmentExtensions = new Set(['.pdf', '.md', '.mdx', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const defaultOptions = {
  host: '127.0.0.1',
  port: 8787,
  requireAuth: false,
  token: undefined,
  contentRoot: 'src/content',
  publicRoot: 'public',
};

export function parseCliArgs(args, env = process.env) {
  const options = { ...defaultOptions, token: env.PUBLISH_API_TOKEN };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--host') {
      options.host = args[++index];
    } else if (arg === '--port') {
      options.port = Number(args[++index]);
    } else if (arg === '--auth') {
      options.requireAuth = true;
    } else if (arg === '--content-root') {
      options.contentRoot = args[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function slugFromFilename(filename) {
  if (!filename || filename !== path.basename(filename) || filename.includes('..')) {
    throw new Error('Unsafe filename');
  }

  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    throw new Error('Unsupported file extension');
  }

  const basename = filename.slice(0, -extension.length);
  const slug = basename
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');

  if (!slug) throw new Error('Unsafe filename');
  return { slug, extension };
}

function safeFilename(filename, allowedExtensionsSet) {
  if (!filename || filename !== path.basename(filename) || filename.includes('..')) {
    throw new Error('Unsafe filename');
  }

  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensionsSet.has(extension)) {
    throw new Error('Unsupported file extension');
  }

  return filename.normalize('NFKC').replace(/[^\p{Letter}\p{Number}._ -]/gu, '-').replace(/\s+/g, '-');
}

export function resolveContentTarget(contentRoot, collection, filename) {
  if (!allowedCollections.has(collection)) {
    throw new Error('Unsupported collection');
  }

  const { slug, extension } = slugFromFilename(filename);
  const root = path.resolve(contentRoot);
  const directory = path.resolve(root, collection);
  const target = path.resolve(directory, `${slug}${extension}`);

  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error('Unsafe filename');
  }

  return {
    collection,
    slug,
    directory,
    target,
    relativePath: path.relative(process.cwd(), target).replace(/\\/g, '/'),
    url: collection === 'pages' ? `/${slug}/` : `/${collection}/${slug}/`,
  };
}

function parseCollection(url) {
  const match = new URL(url, 'http://localhost').pathname.match(/^\/api\/content\/([^/]+)$/);
  return match?.[1];
}

function parseAttachmentRoute(url) {
  const match = new URL(url, 'http://localhost').pathname.match(/^\/api\/attachments\/([^/]+)\/([^/]+)$/);
  if (!match) return undefined;
  return { collection: match[1], slug: match[2] };
}

function parseBoundary(contentType) {
  const match = contentType.match(/(?:^|;)\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  return match?.[1] ?? match?.[2];
}

async function readBody(request, limitBytes = 5 * 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > limitBytes) throw new Error('Request body is too large');
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function parseContentDisposition(header) {
  const result = {};
  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawValue.length) continue;
    result[rawKey.toLowerCase()] = rawValue.join('=').replace(/^"|"$/g, '');
  }
  return result;
}

function parseMultipartFile(buffer, contentType) {
  const boundary = parseBoundary(contentType);
  if (!boundary) throw new Error('Missing multipart boundary');

  const body = buffer.toString('latin1');
  const parts = body.split(`--${boundary}`);

  for (const rawPart of parts) {
    if (!rawPart || rawPart === '--\r\n' || rawPart === '--') continue;

    const part = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separatorIndex = part.indexOf('\r\n\r\n');
    if (separatorIndex === -1) continue;

    const headerText = part.slice(0, separatorIndex);
    const contentText = part.slice(separatorIndex + 4).replace(/\r\n$/, '');
    const headers = Object.fromEntries(
      headerText.split('\r\n').map((line) => {
        const [name, ...value] = line.split(':');
        return [name.toLowerCase(), value.join(':').trim()];
      }),
    );
    const disposition = parseContentDisposition(headers['content-disposition'] ?? '');

    if (disposition.name === 'file' && disposition.filename) {
      return {
        filename: disposition.filename,
        content: Buffer.from(contentText, 'latin1'),
      };
    }
  }

  throw new Error('Missing file field');
}

function isAuthorized(request, { requireAuth, token }) {
  if (!requireAuth) return true;
  return request.headers.authorization === `Bearer ${token}`;
}

async function handlePublish(request, response, options) {
  const collection = parseCollection(request.url ?? '');
  if (!collection) {
    json(response, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (request.method !== 'POST') {
    json(response, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(request, options)) {
    json(response, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  try {
    const contentType = request.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart/form-data');
    }

    const { filename, content } = parseMultipartFile(await readBody(request), contentType);
    const target = resolveContentTarget(options.contentRoot, collection, filename);
    const existed = existsSync(target.target);
    const temporaryTarget = path.join(target.directory, `.${target.slug}.${process.pid}.${Date.now()}.tmp`);

    await mkdir(target.directory, { recursive: true });
    await writeFile(temporaryTarget, content);
    await rename(temporaryTarget, target.target);

    json(response, existed ? 200 : 201, {
      ok: true,
      collection: target.collection,
      slug: target.slug,
      path: target.relativePath,
      url: target.url,
      updated: existed,
    });
  } catch (error) {
    json(response, 400, { ok: false, error: error.message });
  }
}

async function handleAttachmentPublish(request, response, route, options) {
  if (request.method !== 'POST') {
    json(response, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(request, options)) {
    json(response, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  try {
    if (!allowedCollections.has(route.collection) || route.collection === 'sources') {
      throw new Error('Unsupported collection');
    }

    const contentType = request.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart/form-data');
    }

    const { filename, content } = parseMultipartFile(await readBody(request), contentType);
    const safeSlug = safeFilename(route.slug, new Set(['']));
    const safeName = safeFilename(filename, allowedAttachmentExtensions);
    const root = path.resolve(options.publicRoot);
    const directory = path.resolve(root, 'attachments', route.collection, safeSlug);
    const target = path.resolve(directory, safeName);

    if (!target.startsWith(`${root}${path.sep}`)) {
      throw new Error('Unsafe filename');
    }

    const existed = existsSync(target);
    const temporaryTarget = path.join(directory, `.${safeName}.${process.pid}.${Date.now()}.tmp`);

    await mkdir(directory, { recursive: true });
    await writeFile(temporaryTarget, content);
    await rename(temporaryTarget, target);

    json(response, existed ? 200 : 201, {
      ok: true,
      collection: route.collection,
      slug: safeSlug,
      path: path.relative(process.cwd(), target).replace(/\\/g, '/'),
      url: `/attachments/${route.collection}/${safeSlug}/${safeName}`,
      updated: existed,
    });
  } catch (error) {
    json(response, 400, { ok: false, error: error.message });
  }
}

export function createPublishServer(options = {}) {
  const resolvedOptions = { ...defaultOptions, ...options };

  if (resolvedOptions.requireAuth && !resolvedOptions.token) {
    throw new Error('PUBLISH_API_TOKEN is required when --auth is enabled.');
  }

  return createServer((request, response) => {
    const attachmentRoute = parseAttachmentRoute(request.url ?? '');
    const handler = attachmentRoute
      ? handleAttachmentPublish(request, response, attachmentRoute, resolvedOptions)
      : handlePublish(request, response, resolvedOptions);

    handler.catch((error) => {
      resolvedOptions.logger?.error?.(error);
      json(response, 500, { ok: false, error: 'Internal server error' });
    });
  });
}

export async function main(options = parseCliArgs(process.argv.slice(2))) {
  const server = createPublishServer(options);

  await new Promise((resolve) => server.listen(options.port, options.host, resolve));
  console.log(`Publish API listening on http://${options.host}:${options.port}`);
  console.log(`Token auth: ${options.requireAuth ? 'enabled' : 'disabled'}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
