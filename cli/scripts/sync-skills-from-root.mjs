#!/usr/bin/env node
import { cp, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '..');
const repoSkills = path.resolve(cliRoot, '..', 'skills');
const dest = path.join(cliRoot, 'skills');

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(repoSkills, dest, {
  recursive: true,
  filter: (src) => {
    const base = path.basename(src);
    return base !== 'node_modules' && base !== '.git';
  },
});

console.log(`Synced ${repoSkills} -> ${dest}`);
