#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(cliRoot, 'skills');
const manifestPath = path.join(cliRoot, 'skills.json');
const rootManifestPath = path.resolve(cliRoot, '..', 'skills.json');

function parseNameFromSkillMd(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const nameLine = match[1].split('\n').find((l) => l.startsWith('name:'));
  if (!nameLine) return null;
  return nameLine.replace(/^name:\s*/, '').trim();
}

async function loadExisting(p) {
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { schema_version: 1, dependsOn: {} };
  }
}

const entries = await readdir(skillsDir, { withFileTypes: true });
const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

const skillPaths = [];
const folderToName = new Map();

for (const folder of folders) {
  const skillMd = path.join(skillsDir, folder, 'SKILL.md');
  let content;
  try {
    content = await readFile(skillMd, 'utf8');
  } catch {
    console.error(`Missing SKILL.md: ${skillMd}`);
    process.exit(1);
  }
  const name = parseNameFromSkillMd(content);
  if (!name) {
    console.error(`Missing name in frontmatter: ${skillMd}`);
    process.exit(1);
  }
  if (name !== folder) {
    console.error(`Folder "${folder}" does not match SKILL.md name "${name}"`);
    process.exit(1);
  }
  folderToName.set(folder, name);
  skillPaths.push(`skills/${folder}`);
}

const known = new Set(folderToName.values());
const existingCli = await loadExisting(manifestPath);
const existingRoot = await loadExisting(rootManifestPath);
const dependsOn =
  Object.keys(existingCli.dependsOn ?? {}).length > 0
    ? existingCli.dependsOn
    : (existingRoot.dependsOn ?? {});

for (const [skill, deps] of Object.entries(dependsOn)) {
  if (!known.has(skill)) {
    console.error(`dependsOn key unknown skill: ${skill}`);
    process.exit(1);
  }
  for (const dep of deps) {
    if (!known.has(dep)) {
      console.error(`dependsOn[${skill}] references unknown skill: ${dep}`);
      process.exit(1);
    }
  }
}

const meta = { ...existingRoot, ...existingCli };
const manifest = {
  schema_version: meta.schema_version ?? 1,
  name: meta.name ?? 'my-agent-skills',
  version: meta.version ?? '0.1.0',
  skills: skillPaths,
  dependsOn,
};

const json = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(manifestPath, json);
await writeFile(rootManifestPath, json);
console.log(`Wrote ${manifestPath} and ${rootManifestPath} (${skillPaths.length} skills)`);
