import path from 'node:path';
import { CliError } from './errors.js';

const SKILL_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

export function assertValidSkillName(name: string): void {
  if (!name || name === '.' || name === '..') {
    throw new CliError(`Invalid skill name: ${JSON.stringify(name)}`);
  }
  if (name.includes(path.sep) || name.includes('/') || name.includes('\\')) {
    throw new CliError(`Invalid skill name: ${JSON.stringify(name)}`);
  }
  if (!SKILL_NAME_RE.test(name)) {
    throw new CliError(
      `Invalid skill name: ${JSON.stringify(name)}. Use lowercase kebab-case (e.g. my-skill).`,
    );
  }
}

export function assertContained(baseDir: string, resolvedPath: string): void {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(resolvedPath);
  const prefix = base.endsWith(path.sep) ? base : base + path.sep;
  if (resolved !== base && !resolved.startsWith(prefix)) {
    throw new CliError(`Path escapes allowed directory: ${resolvedPath}`);
  }
}

export function resolveSkillDestDir(skillsDir: string, name: string): string {
  assertValidSkillName(name);
  const dest = path.join(skillsDir, name);
  assertContained(skillsDir, dest);
  return dest;
}

export function resolveSkillSourceDir(bundleRoot: string, name: string): string {
  assertValidSkillName(name);
  const source = path.join(bundleRoot, name);
  assertContained(bundleRoot, source);
  return source;
}
