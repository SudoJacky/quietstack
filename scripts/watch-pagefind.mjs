import { spawn } from 'node:child_process';
import { existsSync, statSync, watch } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ignoredPathSegments = new Set(['.astro', '.git', 'dist', 'node_modules']);
const defaultWatchTargets = ['src', 'public', 'astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json'];

const normalizeWatchPath = (filePath) => filePath.replace(/\\/g, '/').replace(/^\.\//, '');

export function shouldWatchPath(filePath) {
  const normalized = normalizeWatchPath(filePath);
  return normalized.split('/').every((segment) => !ignoredPathSegments.has(segment));
}

export function parseCliArgs(args) {
  const previewArgs = [];
  let preview = false;

  for (const arg of args) {
    if (arg === '--preview') {
      preview = true;
      continue;
    }

    previewArgs.push(arg);
  }

  return { preview, previewArgs };
}

export function createRebuildQueue({
  debounceMs = 300,
  logger = console,
  run,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}) {
  let timer;
  let running = false;
  let pendingReason;
  let idleResolvers = [];

  const resolveIdleIfReady = () => {
    if (running || pendingReason || timer) return;
    const resolvers = idleResolvers;
    idleResolvers = [];
    resolvers.forEach((resolve) => resolve());
  };

  const start = async () => {
    timer = undefined;
    if (running || !pendingReason) {
      resolveIdleIfReady();
      return;
    }

    const reason = pendingReason;
    pendingReason = undefined;
    running = true;

    try {
      await run(reason);
    } catch (error) {
      logger.error(error);
    } finally {
      running = false;
      if (pendingReason) {
        timer = setTimeoutFn(start, debounceMs);
      } else {
        resolveIdleIfReady();
      }
    }
  };

  return {
    schedule(reason) {
      pendingReason = reason;
      if (timer) clearTimeoutFn(timer);
      if (!running) timer = setTimeoutFn(start, debounceMs);
    },
    waitForIdle() {
      if (!running && !pendingReason && !timer) return Promise.resolve();
      return new Promise((resolve) => idleResolvers.push(resolve));
    },
  };
}

function runCommand(command, args, { cwd = process.cwd(), logger = console } = {}) {
  logger.log(`\n$ ${[command, ...args].join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(signal ? `${command} exited with signal ${signal}` : `${command} exited with code ${code}`));
    });
  });
}

function startPreview(previewArgs, { cwd = process.cwd(), logger = console } = {}) {
  const args = ['run', 'preview'];
  if (previewArgs.length) args.push('--', ...previewArgs);

  logger.log(`\n$ ${['npm', ...args].join(' ')}`);

  return spawn('npm', args, {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
}

function watchTarget(target, onChange, logger = console) {
  const absoluteTarget = path.resolve(target);
  if (!existsSync(absoluteTarget)) return undefined;

  const stats = statSync(absoluteTarget);
  const watcher = watch(absoluteTarget, { recursive: stats.isDirectory() }, (_eventType, filename) => {
    const changedPath = filename ? path.join(target, filename.toString()) : target;
    if (!shouldWatchPath(changedPath)) return;
    onChange(normalizeWatchPath(changedPath));
  });

  watcher.on('error', (error) => logger.error(error));
  logger.log(`Watching ${normalizeWatchPath(target)}${stats.isDirectory() ? '/**/*' : ''}`);
  return watcher;
}

export async function main({ cwd = process.cwd(), logger = console, preview = false, previewArgs = [] } = {}) {
  process.chdir(cwd);
  let lastBuildSucceeded = false;
  let previewChild;

  const queue = createRebuildQueue({
    logger,
    run: async (reason) => {
      logger.log(`\nRebuilding dist and Pagefind index after change: ${reason}`);
      try {
        await runCommand('npm', ['run', 'build'], { cwd, logger });
        lastBuildSucceeded = true;
      } catch (error) {
        lastBuildSucceeded = false;
        throw error;
      }
      logger.log('Pagefind index is up to date.');
    },
  });

  const watchers = defaultWatchTargets.map((target) => watchTarget(target, (changedPath) => queue.schedule(changedPath), logger));

  if (!watchers.some(Boolean)) {
    throw new Error('No watch targets were found.');
  }

  logger.log('Initial build starting...');
  queue.schedule('startup');

  const close = () => {
    watchers.forEach((watcher) => watcher?.close());
    previewChild?.kill();
  };

  if (preview) {
    await queue.waitForIdle();
    if (!lastBuildSucceeded) {
      close();
      throw new Error('Initial build failed; preview server was not started.');
    }

    previewChild = startPreview(previewArgs, { cwd, logger });
    previewChild.on('exit', (code) => {
      close();
      process.exit(code ?? 0);
    });
  }

  process.once('SIGINT', () => {
    close();
    process.exit(0);
  });

  process.once('SIGTERM', () => {
    close();
    process.exit(0);
  });
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const options = parseCliArgs(process.argv.slice(2));
  main(options).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
