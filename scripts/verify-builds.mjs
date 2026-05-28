import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function runBuild({ basePath, label }) {
  console.log(`\nVerifying ${label} build`);

  return new Promise((resolve, reject) => {
    const child = spawn('npm run build', {
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: '1',
        PUBLIC_BASE_PATH: basePath,
      },
      shell: true,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(signal ? `Build exited with signal ${signal}` : `Build exited with code ${code}`));
    });
  });
}

async function main() {
  await runBuild({ basePath: '/', label: 'root-path' });
  await runBuild({ basePath: '/quietstack/', label: 'subpath' });

  const pagefindBundle = path.resolve('dist', 'pagefind', 'pagefind.js');
  if (!existsSync(pagefindBundle)) {
    throw new Error('Expected dist/pagefind/pagefind.js after verification builds.');
  }

  console.log('\nRoot and subpath builds emitted Pagefind output.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
