import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInit } from './init.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'skillcourse-cli-init-'));
  return async () => rm(tmpDir, { recursive: true, force: true });
});

describe('runInit', () => {
  it('scaffolds a complete course folder under courses/<slug>', async () => {
    await runInit({
      slug: 'my-test-course',
      title: 'My test',
      description: 'A test course.',
      locale: 'en',
      author: 'tester',
      addQuiz: false,
      cwd: tmpDir,
    });

    const courseDir = join(tmpDir, 'courses', 'my-test-course');
    const skillMd = await readFile(join(courseDir, 'SKILL.md'), 'utf8');
    const metadata = JSON.parse(await readFile(join(courseDir, 'metadata.json'), 'utf8'));
    const changelog = await readFile(join(courseDir, 'CHANGELOG.md'), 'utf8');

    expect(skillMd).toContain('name: my-test-course');
    expect(metadata.title.en).toBe('My test');
    expect(metadata.author).toBe('tester');
    expect(changelog).toContain('## [0.1.0]');
  });

  it('writes SKILL_HE.md when locale is both', async () => {
    await runInit({
      slug: 'bilingual',
      title: 'Bi',
      description: 'Bi.',
      locale: 'both',
      author: 'tester',
      addQuiz: false,
      cwd: tmpDir,
    });
    const courseDir = join(tmpDir, 'courses', 'bilingual');
    const skillHe = await readFile(join(courseDir, 'SKILL_HE.md'), 'utf8');
    expect(skillHe).toContain('## סקילים נלווים');
  });

  it('writes quiz.json when addQuiz is true', async () => {
    await runInit({
      slug: 'quizzed',
      title: 'Q',
      description: 'Q.',
      locale: 'en',
      author: 'tester',
      addQuiz: true,
      quizMode: 'final_exam',
      cwd: tmpDir,
    });
    const quiz = JSON.parse(
      await readFile(join(tmpDir, 'courses', 'quizzed', 'quiz.json'), 'utf8'),
    );
    expect(quiz.presentation).toBe('final_exam');
  });

  it('throws when the target course folder already exists', async () => {
    await runInit({
      slug: 'dup',
      title: 'T',
      description: 'D',
      locale: 'en',
      author: 'tester',
      addQuiz: false,
      cwd: tmpDir,
    });
    await expect(
      runInit({
        slug: 'dup',
        title: 'T',
        description: 'D',
        locale: 'en',
        author: 'tester',
        addQuiz: false,
        cwd: tmpDir,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('rejects slugs that are not kebab-case', async () => {
    await expect(
      runInit({
        slug: 'Not Kebab',
        title: 'T',
        description: 'D',
        locale: 'en',
        author: 'tester',
        addQuiz: false,
        cwd: tmpDir,
      }),
    ).rejects.toThrow(/slug/);
  });
});
