import type { SkillsManifest } from './bundle.js';
import { skillNamesFromManifest } from './bundle.js';
import { CliError } from './errors.js';

export interface ExpandResult {
  ordered: string[];
  addedBy: Map<string, string>;
}

export function expandDependencies(
  manifest: SkillsManifest,
  selected: string[],
): ExpandResult {
  const known = new Set(skillNamesFromManifest(manifest));
  const selectedSet = new Set(selected);

  for (const name of selected) {
    if (!known.has(name)) {
      throw new CliError(`Unknown skill: ${name}`);
    }
  }

  const addedBy = new Map<string, string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: string[] = [];

  function visit(name: string, _parent: string | null): void {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new CliError(`Circular skill dependency involving: ${name}`);
    }
    visiting.add(name);

    for (const dep of manifest.dependsOn[name] ?? []) {
      if (!known.has(dep)) {
        throw new CliError(`dependsOn references unknown skill "${dep}" (from ${name})`);
      }
      if (!selectedSet.has(dep) && !addedBy.has(dep)) {
        addedBy.set(dep, name);
      }
      visit(dep, name);
    }

    visiting.delete(name);
    visited.add(name);
    ordered.push(name);
  }

  for (const name of selected) {
    visit(name, null);
  }

  return { ordered, addedBy };
}

export interface RemoveDependentWarning {
  target: string;
  dependents: string[];
}

/** Installed skills that still declare `target` in manifest dependsOn. */
export function findInstalledDependents(
  manifest: SkillsManifest,
  installed: string[],
  toRemove: string[],
): RemoveDependentWarning[] {
  const removeSet = new Set(toRemove);
  const warnings: RemoveDependentWarning[] = [];

  for (const target of toRemove) {
    const dependents = installed.filter(
      (name) =>
        !removeSet.has(name) && (manifest.dependsOn[name] ?? []).includes(target),
    );
    if (dependents.length > 0) {
      warnings.push({ target, dependents });
    }
  }

  return warnings;
}

export function formatRemoveDependentNote(warnings: RemoveDependentWarning[]): string {
  const lines = warnings.map(
    (w) => `${w.dependents.join(', ')} depend on ${w.target}`,
  );
  return [
    'The following installed skills depend on skill(s) you selected:',
    '',
    ...lines.map((l) => `  • ${l}`),
  ].join('\n');
}
