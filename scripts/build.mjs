import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const buildEntries = ['index.html', 'css', 'js', 'data'];

async function exists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const entry of buildEntries) {
    const sourcePath = path.join(rootDir, entry);
    if (!(await exists(sourcePath))) {
      continue;
    }

    const destinationPath = path.join(distDir, entry);
    await cp(sourcePath, destinationPath, { recursive: true });
    console.log(`copied ${entry}`);
  }

  console.log(`build complete: ${distDir}`);
}

build().catch((error) => {
  console.error('build failed');
  console.error(error);
  process.exitCode = 1;
});