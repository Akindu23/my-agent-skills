import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const skillsRoot = path.join(repoRoot, 'skills');

const CROSS_SKILL_LINK_RE = /(?:\]\(|\`)(\.\.\/[a-z0-9-]+(?:\/[^)\`#]+)?)/g;

async function listSkillNames(): Promise<Set<string>> {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function stripLinkSuffix(target: string): string {
  return target.split('#')[0]!.split('?')[0]!;
}

describe('cross-skill relative links', () => {
  it('resolve from each source file (installed .agents/skills sibling layout)', async () => {
    const skillNames = await listSkillNames();
    const files = await walkMarkdownFiles(skillsRoot);
    const failures: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf8');
      const relFromRepo = path.relative(repoRoot, file);
      for (const match of content.matchAll(CROSS_SKILL_LINK_RE)) {
        const raw = match[1]!;
        const firstSegment = raw.split('/')[1];
        if (!firstSegment || !skillNames.has(firstSegment)) continue;

        const relTarget = stripLinkSuffix(raw);
        const resolved = path.normalize(path.resolve(path.dirname(file), relTarget));
        const skillsPrefix = skillsRoot + path.sep;
        if (!resolved.startsWith(skillsPrefix)) {
          failures.push(`${relFromRepo}: ${raw} escapes skills root`);
          continue;
        }
        try {
          await access(resolved);
        } catch {
          failures.push(
            `${relFromRepo}: ${raw} -> missing ${path.relative(repoRoot, resolved)}`,
          );
        }
      }
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });
});
