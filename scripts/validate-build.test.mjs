import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

const requiredAssets = ['index.html', 'img/favicon.png', 'img/og.png'];

const requiredMetaPatterns = [
  {
    label: 'canonical URL',
    pattern: /<link rel="canonical" href="https:\/\/movecheck\.coolkuma\.workers\.dev\/"\s*\/?>/,
  },
  {
    label: 'favicon link',
    pattern: /<link rel="icon" type="image\/png" href="\/img\/favicon\.png"\s*\/?>/,
  },
  {
    label: 'apple touch icon',
    pattern: /<link rel="apple-touch-icon" href="\/img\/favicon\.png"\s*\/?>/,
  },
  {
    label: 'og:url',
    pattern: /<meta property="og:url" content="https:\/\/movecheck\.coolkuma\.workers\.dev\/"\s*\/?>/,
  },
  {
    label: 'og:image',
    pattern: /<meta property="og:image" content="https:\/\/movecheck\.coolkuma\.workers\.dev\/img\/og\.png"\s*\/?>/,
  },
  {
    label: 'og:image:secure_url',
    pattern: /<meta property="og:image:secure_url" content="https:\/\/movecheck\.coolkuma\.workers\.dev\/img\/og\.png"\s*\/?>/,
  },
  {
    label: 'twitter:image',
    pattern: /<meta name="twitter:image" content="https:\/\/movecheck\.coolkuma\.workers\.dev\/img\/og\.png"\s*\/?>/,
  },
];

async function ensureDistEntry(relativePath) {
  await access(path.join(distDir, relativePath), constants.F_OK);
}

test('배포 산출물에 favicon 및 OG 이미지가 포함된다', async () => {
  await Promise.all(
    requiredAssets.map(async (relativePath) => {
      await assert.doesNotReject(
        () => ensureDistEntry(relativePath),
        `${relativePath} 파일이 dist에 포함되어야 합니다.`,
      );
    }),
  );
});

test('배포 산출물 index.html에 필수 메타 태그가 포함된다', async () => {
  const html = await readFile(indexPath, 'utf8');

  requiredMetaPatterns.forEach(({ label, pattern }) => {
    assert.match(html, pattern, `${label} 설정이 누락되었거나 잘못되었습니다.`);
  });
});