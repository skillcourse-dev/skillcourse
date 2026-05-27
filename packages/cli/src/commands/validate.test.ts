import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runValidate } from './validate.js';

let tmpDir: string;
let courseDir: string;

const validSkillMd = `---
name: ok-course
description: A valid test course.
license: MIT
---

## 1. Intro

Body text here.

## Companion skills

- [example](https://github.com/example/example): \`npx cli add example\`
`;

const validMetadata = JSON.stringify({
  type: 'course',
  version: '0.1.0',
  title: { en: 'Ok' },
  description: { en: 'Ok' },
  author: 'a',
  license: 'MIT',
  recommended_skills: ['example'],
});

const validChangelog = `## [0.1.0] - 2026-05-28
### Added
- Initial release.
`;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'skillcourse-cli-validate-'));
  courseDir = join(tmpDir, 'courses', 'ok-course');
  await mkdir(courseDir, { recursive: true });
  await writeFile(join(courseDir, 'SKILL.md'), validSkillMd, 'utf8');
  await writeFile(join(courseDir, 'metadata.json'), validMetadata, 'utf8');
  await writeFile(join(courseDir, 'CHANGELOG.md'), validChangelog, 'utf8');
  return async () => rm(tmpDir, { recursive: true, force: true });
});

describe('runValidate', () => {
  it('returns ok=true for a fully valid course', async () => {
    const result = await runValidate({ courseDir });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports a SKILL.md frontmatter error with the file path', async () => {
    await writeFile(join(courseDir, 'SKILL.md'), `---\nname: x\n---\nbody`, 'utf8');
    const result = await runValidate({ courseDir });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.file?.endsWith('SKILL.md') && /frontmatter/i.test(e.message)),
    ).toBe(true);
  });

  it('reports a metadata.json schema violation', async () => {
    await writeFile(
      join(courseDir, 'metadata.json'),
      JSON.stringify({
        type: 'skill',
        version: '0.1.0',
        title: { en: 'x' },
        description: { en: 'x' },
        author: 'a',
        license: 'MIT',
      }),
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.file?.endsWith('metadata.json'))).toBe(true);
  });

  it('reports a malformed quiz.json when present', async () => {
    await writeFile(
      join(courseDir, 'quiz.json'),
      JSON.stringify({ presentation: 'final_exam', chapters: {} }),
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.file?.endsWith('quiz.json'))).toBe(true);
  });
});

describe('runValidate structural checks', () => {
  it('reports a CHANGELOG version mismatch', async () => {
    await writeFile(
      join(courseDir, 'CHANGELOG.md'),
      `## [9.9.9] - 2026-05-28\n### Added\n- nothing\n`,
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.file === 'CHANGELOG.md' && /9\.9\.9/.test(e.message)),
    ).toBe(true);
  });

  it('reports em-dash usage in SKILL.md', async () => {
    await writeFile(
      join(courseDir, 'SKILL.md'),
      validSkillMd.replace('Body text here.', 'Body text — has em-dash.'),
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.errors.some((e) => /em-dash/i.test(e.message))).toBe(true);
  });

  it('reports recommended_skills drift between metadata and SKILL.md', async () => {
    await writeFile(
      join(courseDir, 'metadata.json'),
      JSON.stringify({
        type: 'course',
        version: '0.1.0',
        title: { en: 'Ok' },
        description: { en: 'Ok' },
        author: 'a',
        license: 'MIT',
        recommended_skills: ['mismatch'],
      }),
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.errors.some((e) => /drift/.test(e.message))).toBe(true);
  });

  it('reports a broken relative link in SKILL.md', async () => {
    await writeFile(
      join(courseDir, 'SKILL.md'),
      validSkillMd.replace(
        '## 1. Intro',
        '## 1. Intro\n\nSee [missing](references/missing.md).',
      ),
      'utf8',
    );
    const result = await runValidate({ courseDir });
    expect(result.errors.some((e) => /missing\.md/.test(e.message))).toBe(true);
  });
});
