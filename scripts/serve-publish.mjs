import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseCliArgs(args) {
  const previewArgs = [];
  const publishArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--host' || arg === '--port') {
      previewArgs.push(arg, args[++index]);
    } else if (arg === '--api-host') {
      publishArgs.push('--host', args[++index]);
    } else if (arg === '--api-port') {
      publishArgs.push('--port', args[++index]);
    } else if (arg === '--auth') {
      publishArgs.push('--auth');
    } else if (arg === '--content-root') {
      publishArgs.push('--content-root', args[++index]);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { previewArgs, publishArgs };
}

function startNpmScript(script, args = []) {
  const npmArgs = ['run', script];
  if (args.length) npmArgs.push('--', ...args);

  console.log(`\n$ ${['npm', ...npmArgs].join(' ')}`);

  return spawn('npm', npmArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
}

export function main({ previewArgs = [], publishArgs = [] } = parseCliArgs(process.argv.slice(2))) {
  const children = [startNpmScript('preview:watch', previewArgs), startNpmScript('publish-api', publishArgs)];
  let exiting = false;

  const close = (code = 0) => {
    if (exiting) return;
    exiting = true;
    children.forEach((child) => child.kill());
    process.exit(code);
  };

  children.forEach((child) => {
    child.on('exit', (code) => close(code ?? 0));
  });

  process.once('SIGINT', () => close(0));
  process.once('SIGTERM', () => close(0));
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
