import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import semver from 'semver';

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

  const metadataPath = join(opts.courseDir, 'metadata.json');
  let metadataRaw: string;
  try {
    metadataRaw = await readFile(metadataPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`metadata.json not found at ${metadataPath}`);
    }
    throw err;
  }
  const metadata = JSON.parse(metadataRaw) as { version: string; [k: string]: unknown };
  const from = metadata.version;
  const to = semver.inc(from, opts.kind);
  if (!to) throw new Error(`could not bump invalid semver: ${from}`);

  metadata.version = to;
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  const changelogPath = join(opts.courseDir, 'CHANGELOG.md');
  const changelogRaw = await readFile(changelogPath, 'utf8').catch(() => '');
  const newEntry = `## [${to}] - ${isoToday()}\n### Added\n- ${opts.summary}\n\n`;
  await writeFile(changelogPath, newEntry + changelogRaw, 'utf8');

  return { from, to };
}

export function registerBump(program: Command): void {
  program
    .command('bump <kind>')
    .description('Bump version (patch | minor | major) and prepend a CHANGELOG entry')
    .option('--summary <summary>', 'Changelog summary line')
    .option('--path <path>', 'Course folder (default: cwd)')
    .action(async (kind: string, options: { summary?: string; path?: string }) => {
      const courseDir = options.path ?? process.cwd();
      const summary = options.summary ?? '(no summary)';
      const { from, to } = await runBump({ courseDir, kind: kind as BumpKind, summary });
      console.log(pc.green(`✓ ${from} -> ${to}`));
    });
}
