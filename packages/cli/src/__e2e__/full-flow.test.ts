import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(here, '..', '..');
const binPath = resolve(cliRoot, 'dist', 'bin.js');

function run(
  args: string[],
  cwd: string,
): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync('node', [binPath, ...args], { cwd, encoding: 'utf8' });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

beforeAll(() => {
  if (!existsSync(binPath)) {
    throw new Error(
      `dist/bin.js does not exist at ${binPath}. ` +
        `Run \`pnpm --filter @skillcourse-dev/cli build\` first.`,
    );
  }
});

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'skillcourse-cli-e2e-'));
  return async () => rm(workDir, { recursive: true, force: true });
});

describe('full authoring flow', () => {
  it('init -> validate -> quiz init -> validate -> bump -> validate', async () => {
    const init = run(
      [
        'init',
        'flow-test',
        '--title',
        'Flow test',
        '--description',
        'End-to-end smoke',
        '--author',
        'tester',
        '--no-quiz',
        '--locale',
        'en',
      ],
      workDir,
    );
    expect(init.status, init.stderr).toBe(0);

    const courseDir = join(workDir, 'courses', 'flow-test');

    const validate1 = run(['validate', courseDir], workDir);
    expect(validate1.status, validate1.stderr).toBe(0);

    const quizInit = run(['quiz', 'init', '--path', courseDir, '--mode', 'per_chapter'], workDir);
    expect(quizInit.status, quizInit.stderr).toBe(0);

    const validate2 = run(['validate', courseDir], workDir);
    expect(validate2.status, validate2.stderr).toBe(0);

    const bump = run(['bump', 'patch', '--summary', 'fixed something', '--path', courseDir], workDir);
    expect(bump.status, bump.stderr).toBe(0);

    const metadata = JSON.parse(await readFile(join(courseDir, 'metadata.json'), 'utf8'));
    expect(metadata.version).toBe('0.1.1');

    const validate3 = run(['validate', courseDir], workDir);
    expect(validate3.status, validate3.stderr).toBe(0);
  });
});
