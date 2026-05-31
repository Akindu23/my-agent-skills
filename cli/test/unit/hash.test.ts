import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computeSkillFolderHash } from '../../src/lib/hash.js';

const dirs: string[] = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs.length = 0;
});

async function tempSkill(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'skill-hash-'));
  dirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content);
  }
  return dir;
}

describe('computeSkillFolderHash', () => {
  it('is deterministic for the same tree', async () => {
    const dir = await tempSkill({ 'SKILL.md': '# A\n', 'refs/x.md': 'x' });
    const a = await computeSkillFolderHash(dir);
    const b = await computeSkillFolderHash(dir);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when content changes', async () => {
    const dir = await tempSkill({ 'SKILL.md': '# A\n' });
    const before = await computeSkillFolderHash(dir);
    await writeFile(path.join(dir, 'SKILL.md'), '# B\n');
    const after = await computeSkillFolderHash(dir);
    expect(before).not.toBe(after);
  });

  it('ignores node_modules subtree', async () => {
    const dir = await tempSkill({ 'SKILL.md': '# A\n' });
    const before = await computeSkillFolderHash(dir);
    await mkdir(path.join(dir, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(path.join(dir, 'node_modules', 'pkg', 'index.js'), 'noise');
    const after = await computeSkillFolderHash(dir);
    expect(before).toBe(after);
  });
});
