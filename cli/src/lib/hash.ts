import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules']);

async function collectFiles(
  dir: string,
  base: string,
): Promise<Array<{ relativePath: string; content: Buffer }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ relativePath: string; content: Buffer }> = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...(await collectFiles(fullPath, base)));
      continue;
    }
    if (!entry.isFile()) continue;

    const relativePath = path
      .relative(base, fullPath)
      .split(path.sep)
      .join('/');
    const content = await readFile(fullPath);
    files.push({ relativePath, content });
  }

  return files;
}

export async function computeSkillFolderHash(skillDir: string): Promise<string> {
  const files = await collectFiles(skillDir, skillDir);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest('hex');
}
