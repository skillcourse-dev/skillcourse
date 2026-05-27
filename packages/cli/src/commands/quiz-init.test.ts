import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runQuizInit } from './quiz-init.js';

let tmpDir: string;
let courseDir: string;

const skillMd = `---
name: c
description: d
license: MIT
---

## 1. A
body
## 2. B
body
## 3. C
body
## Companion skills
- list
`;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'skillcourse-cli-quiz-init-'));
  courseDir = join(tmpDir, 'course');
  await mkdir(courseDir, { recursive: true });
  await writeFile(join(courseDir, 'SKILL.md'), skillMd, 'utf8');
  return async () => rm(tmpDir, { recursive: true, force: true });
});

describe('runQuizInit', () => {
  it('scaffolds quiz.json mirroring the 3 chapters with placeholder questions', async () => {
    await runQuizInit({ courseDir, mode: 'per_chapter' });
    const quiz = JSON.parse(await readFile(join(courseDir, 'quiz.json'), 'utf8'));
    expect(quiz.presentation).toBe('per_chapter');
    expect(Object.keys(quiz.chapters)).toEqual(['1', '2', '3']);
    expect(quiz.chapters['1']).toHaveLength(1);
  });

  it('scaffolds a final_exam quiz with one placeholder question (schema-valid)', async () => {
    await runQuizInit({ courseDir, mode: 'final_exam' });
    const quiz = JSON.parse(await readFile(join(courseDir, 'quiz.json'), 'utf8'));
    expect(quiz.presentation).toBe('final_exam');
    expect(quiz.final_exam).toHaveLength(1);
  });

  it('refuses to overwrite an existing quiz.json without --force', async () => {
    await writeFile(join(courseDir, 'quiz.json'), '{"existing":true}', 'utf8');
    await expect(runQuizInit({ courseDir, mode: 'per_chapter' })).rejects.toThrow(
      /already exists/,
    );
  });

  it('overwrites with force=true', async () => {
    await writeFile(join(courseDir, 'quiz.json'), '{"existing":true}', 'utf8');
    await runQuizInit({ courseDir, mode: 'per_chapter', force: true });
    const quiz = JSON.parse(await readFile(join(courseDir, 'quiz.json'), 'utf8'));
    expect(quiz.presentation).toBe('per_chapter');
  });

  it('throws when SKILL.md is missing', async () => {
    await rm(join(courseDir, 'SKILL.md'));
    await expect(runQuizInit({ courseDir, mode: 'per_chapter' })).rejects.toThrow(/SKILL\.md/);
  });
});
