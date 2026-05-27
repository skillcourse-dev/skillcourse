import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBump } from './bump.js';

let tmpDir: string;
let courseDir: string;

const initialMetadata = JSON.stringify(
  {
    type: 'course',
    version: '1.0.0',
    title: { en: 'T' },
    description: { en: 'D' },
    author: 'a',
    license: 'MIT',
  },
  null,
  2,
);

const initialChangelog = `## [1.0.0] - 2026-05-01
### Added
- Initial release.
`;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'skillcourse-cli-bump-'));
  courseDir = join(tmpDir, 'course');
  await mkdir(courseDir, { recursive: true });
  await writeFile(join(courseDir, 'metadata.json'), initialMetadata, 'utf8');
  await writeFile(join(courseDir, 'CHANGELOG.md'), initialChangelog, 'utf8');
  return async () => rm(tmpDir, { recursive: true, force: true });
});

describe('runBump', () => {
  it('bumps patch and prepends a changelog entry', async () => {
    await runBump({ courseDir, kind: 'patch', summary: 'Fixed typo' });

    const meta = JSON.parse(await readFile(join(courseDir, 'metadata.json'), 'utf8'));
    expect(meta.version).toBe('1.0.1');

    const cl = await readFile(join(courseDir, 'CHANGELOG.md'), 'utf8');
    expect(cl).toMatch(/^## \[1\.0\.1\] - \d{4}-\d{2}-\d{2}/);
    expect(cl).toContain('Fixed typo');
    expect(cl).toContain('## [1.0.0]');
  });

  it('bumps minor', async () => {
    await runBump({ courseDir, kind: 'minor', summary: 'Added chapter 4' });
    const meta = JSON.parse(await readFile(join(courseDir, 'metadata.json'), 'utf8'));
    expect(meta.version).toBe('1.1.0');
  });

  it('bumps major', async () => {
    await runBump({ courseDir, kind: 'major', summary: 'Rewrote entirely' });
    const meta = JSON.parse(await readFile(join(courseDir, 'metadata.json'), 'utf8'));
    expect(meta.version).toBe('2.0.0');
  });

  it('throws when kind is invalid', async () => {
    await expect(
      runBump({ courseDir, kind: 'bogus' as 'patch', summary: 'x' }),
    ).rejects.toThrow(/kind/);
  });

  it('throws when metadata.json is missing', async () => {
    await rm(join(courseDir, 'metadata.json'));
    await expect(runBump({ courseDir, kind: 'patch', summary: 'x' })).rejects.toThrow(
      /metadata\.json/,
    );
  });
});
