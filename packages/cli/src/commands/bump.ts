import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import semver from 'semver';
import { loadValidatedMetadata, writeMetadata } from '../lib/metadata-io.js';

export type BumpKind = 'patch' | 'minor' | 'major';

export interface BumpOpts {
  courseDir: string;
  kind: BumpKind;
  summary: string;
}

const VALID_KINDS: ReadonlySet<BumpKind> = new Set(['patch', 'minor', 'major']);

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runBump(opts: BumpOpts): Promise<{ from: string; to: string }> {
  if (!VALID_KINDS.has(opts.kind)) {
    throw new Error(`kind must be patch | minor | major, got: ${opts.kind}`);
  }

  // Schema-validated load: surfaces "missing", "corrupt JSON", "invalid type",
  // and "invalid version field" with proper file attribution. Avoids the
  // partial-mutation hazard of the old raw-cast approach.
  const metadata = await loadValidatedMetadata(opts.courseDir);
  const from = metadata.version;
  const to = semver.inc(from, opts.kind);
  if (!to) throw new Error(`could not bump metadata.json version (invalid semver: ${from})`);

  // CHANGELOG.md is required by spec. Do NOT silently create it: validate
  // also enforces presence, so a missing CHANGELOG is a real error to surface,
  // not paper over.
  const changelogPath = join(opts.courseDir, 'CHANGELOG.md');
  let changelogRaw: string;
  try {
    changelogRaw = await readFile(changelogPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`CHANGELOG.md not found at ${changelogPath} (required by spec)`);
    }
    throw err;
  }

  metadata.version = to;
  await writeMetadata(opts.courseDir, metadata);

  const newEntry = `## [${to}] - ${isoToday()}\n### Added\n- ${opts.summary}\n\n`;
  await writeFile(changelogPath, newEntry + changelogRaw, 'utf8');

  return { from, to };
}

export function registerBump(program: Command): void {
  program
    .command('bump <kind> [path]')
    .description('Bump version (patch | minor | major) and prepend a CHANGELOG entry. Default path: cwd.')
    .option('--summary <summary>', 'Changelog summary line')
    .action(async (kind: string, path: string | undefined, options: { summary?: string }) => {
      const courseDir = path ?? process.cwd();
      const summary = options.summary ?? '(no summary)';
      const { from, to } = await runBump({ courseDir, kind: kind as BumpKind, summary });
      console.log(pc.green(`✓ ${from} -> ${to}`));
    });
}
