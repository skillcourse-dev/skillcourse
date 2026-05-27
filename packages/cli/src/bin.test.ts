import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cliDir = resolve(here, '..');
const binPath = resolve(cliDir, 'dist', 'bin.js');

function runCli(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync('node', [binPath, ...args], { encoding: 'utf8' });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
}

beforeAll(() => {
  if (!existsSync(binPath)) {
    throw new Error(
      `dist/bin.js does not exist at ${binPath}. ` +
        `Run \`pnpm --filter @skillcourse-dev/cli build\` first.`,
    );
  }
});

describe('skill-course bin', () => {
  it('prints --help with all four commands listed', () => {
    const out = runCli(['--help']);
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/init/);
    expect(out.stdout).toMatch(/validate/);
    expect(out.stdout).toMatch(/bump/);
    expect(out.stdout).toMatch(/quiz/);
  });

  it('prints --version', () => {
    const out = runCli(['--version']);
    expect(out.status).toBe(0);
    expect(out.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('exits non-zero on unknown command', () => {
    const out = runCli(['bogus']);
    expect(out.status).not.toBe(0);
  });
});
