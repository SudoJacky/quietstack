import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createPublishServer, parseCliArgs, resolveContentTarget } from '../scripts/publish-api.mjs';

async function withServer(options, callback) {
  const server = createPublishServer({ logger: { log() {}, error() {} }, ...options });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function markdownForm(filename = 'hello-world.md') {
  const form = new FormData();
  form.set('file', new Blob(['---\ntitle: Hello World\n---\n\nBody'], { type: 'text/markdown' }), filename);
  return form;
}

function fileForm(filename, content = 'file content', type = 'application/octet-stream') {
  const form = new FormData();
  form.set('file', new Blob([content], { type }), filename);
  return form;
}

test('parseCliArgs reserves token auth behind an explicit flag', () => {
  assert.deepEqual(parseCliArgs([]), {
    host: '127.0.0.1',
    port: 8787,
    requireAuth: false,
    token: undefined,
    contentRoot: 'src/content',
    publicRoot: 'public',
  });

  assert.deepEqual(parseCliArgs(['--host', '0.0.0.0', '--port', '9000', '--auth', '--content-root', 'content']), {
    host: '0.0.0.0',
    port: 9000,
    requireAuth: true,
    token: undefined,
    contentRoot: 'content',
    publicRoot: 'public',
  });
});

test('resolveContentTarget rejects unsafe filenames and collections', () => {
  const root = path.join(tmpdir(), 'quietstack-content');

  assert.throws(() => resolveContentTarget(root, 'posts', '../evil.md'), /Unsafe filename/);
  assert.throws(() => resolveContentTarget(root, 'posts', 'draft.txt'), /Unsupported file extension/);
  assert.throws(() => resolveContentTarget(root, 'assets', 'hello.md'), /Unsupported collection/);
  assert.equal(resolveContentTarget(root, 'sources', 'paper.md').slug, 'paper');
});

test('publish API uploads markdown into the requested content collection', async () => {
  const contentRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-'));

  try {
    await withServer({ contentRoot, requireAuth: false }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/content/posts`, {
        method: 'POST',
        body: markdownForm(),
      });

      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(body.collection, 'posts');
      assert.equal(body.slug, 'hello-world');
      assert.equal(body.url, '/posts/hello-world/');

      const content = await readFile(path.join(contentRoot, 'posts', 'hello-world.md'), 'utf8');
      assert.match(content, /title: Hello World/);
    });
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
  }
});

test('publish API uploads attachments under public attachments', async () => {
  const contentRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-content-'));
  const publicRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-public-'));

  try {
    await withServer({ contentRoot, publicRoot, requireAuth: false }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/attachments/posts/hello-world`, {
        method: 'POST',
        body: fileForm('paper.pdf', '%PDF-1.7', 'application/pdf'),
      });

      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(body.url, '/attachments/posts/hello-world/paper.pdf');

      const content = await readFile(path.join(publicRoot, 'attachments', 'posts', 'hello-world', 'paper.pdf'), 'utf8');
      assert.equal(content, '%PDF-1.7');
    });
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
    await rm(publicRoot, { recursive: true, force: true });
  }
});

test('publish API rejects unsafe attachment filenames', async () => {
  const contentRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-content-'));
  const publicRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-public-'));

  try {
    await withServer({ contentRoot, publicRoot, requireAuth: false }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/attachments/posts/hello-world`, {
        method: 'POST',
        body: fileForm('../paper.pdf', '%PDF-1.7', 'application/pdf'),
      });

      assert.equal(response.status, 400);
    });
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
    await rm(publicRoot, { recursive: true, force: true });
  }
});

test('publish API enforces bearer auth when enabled', async () => {
  const contentRoot = await mkdtemp(path.join(tmpdir(), 'quietstack-publish-auth-'));

  try {
    await withServer({ contentRoot, requireAuth: true, token: 'secret' }, async (baseUrl) => {
      const unauthorized = await fetch(`${baseUrl}/api/content/posts`, {
        method: 'POST',
        body: markdownForm(),
      });

      assert.equal(unauthorized.status, 401);

      const authorized = await fetch(`${baseUrl}/api/content/posts`, {
        method: 'POST',
        headers: { Authorization: 'Bearer secret' },
        body: markdownForm('authenticated.md'),
      });

      assert.equal(authorized.status, 201);
      assert.equal((await authorized.json()).slug, 'authenticated');
    });
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
  }
});
