import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const required = JSON.parse(await fs.readFile('.next/required-server-files.json', 'utf8'));
if (required.config.output !== 'standalone') throw new Error('Build with output: standalone first');
const hash = crypto.createHash('sha256');
async function fingerprint(relative) {
  const absolute = path.join(root, relative);
  const stat = await fs.lstat(absolute);
  if (stat.isSymbolicLink()) throw new Error(`Unexpected source symlink: ${relative}`);
  if (stat.isDirectory()) {
    for (const entry of (await fs.readdir(absolute)).sort())
      await fingerprint(`${relative}/${entry}`);
  } else {
    hash.update(relative + '\0');
    hash.update(await fs.readFile(absolute));
    hash.update('\0');
  }
}
for (const file of ['src', 'public', 'package.json', 'package-lock.json', 'next.config.ts'])
  await fingerprint(file);
const sourceSha256 = hash.digest('hex');
const builtAt = new Date().toISOString();
const releaseId = `our-story-${builtAt.replace(/[-:.]/g, '')}-${sourceSha256.slice(0, 10)}`;
const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'our-story-package-'));
const artifact = path.join(os.tmpdir(), `${releaseId}.tar.gz`);
try {
  await fs.cp('.next/standalone', staging, { recursive: true });
  await fs.cp('public', path.join(staging, 'public'), { recursive: true });
  await fs.cp('.next/static', path.join(staging, '.next/static'), { recursive: true });
  await fs.mkdir(path.join(staging, 'seed'), { recursive: true });
  const seed = await fs.readFile('src/content/archive.json');
  await fs.writeFile(path.join(staging, 'seed/archive.json'), seed);
  const manifest = {
    releaseId,
    builtAt,
    basePath: required.config.basePath,
    nodeVersion: process.version,
    platform: `${process.platform}-${process.arch}`,
    gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    workingTreeDirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
    sourceSha256,
    buildId: (await fs.readFile('.next/BUILD_ID', 'utf8')).trim(),
    seedSha256: crypto.createHash('sha256').update(seed).digest('hex'),
  };
  await fs.writeFile(path.join(staging, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  // Package the traced runtime only; no SSH config, environment files, reference video, or tests.
  execFileSync('tar', ['-czf', artifact, '-C', staging, '.']);
  const sha256 = crypto
    .createHash('sha256')
    .update(await fs.readFile(artifact))
    .digest('hex');
  await fs.writeFile(artifact + '.sha256', `${sha256}  ${path.basename(artifact)}\n`);
  console.log(JSON.stringify({ artifact, sha256, manifest }, null, 2));
} finally {
  await fs.rm(staging, { recursive: true, force: true });
}
