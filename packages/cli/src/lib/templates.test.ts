import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import {
  skillMdTemplate,
  metadataJsonTemplate,
  changelogTemplate,
  quizJsonTemplate,
} from './templates.js';

describe('skillMdTemplate', () => {
  it('produces SKILL.md with frontmatter and 3 placeholder chapters', () => {
    const out = skillMdTemplate({ name: 'my-course', description: 'A test', locale: 'en' });
    expect(out).toMatch(/^---\n/);
    expect(out).toContain('name: my-course');
    expect(out).toContain('description: A test');
    expect(out).toContain('license: MIT');
    expect(out).toContain('## 1.');
    expect(out).toContain('## 2.');
    expect(out).toContain('## 3.');
    expect(out).toContain('## Companion skills');
  });

  it('uses the Hebrew companion section heading when locale is he', () => {
    const out = skillMdTemplate({ name: 'x', description: 'd', locale: 'he' });
    expect(out).toContain('## סקילים נלווים');
    expect(out).not.toContain('## Companion skills');
  });
});

describe('metadataJsonTemplate', () => {
  it('produces a strict-schema-valid metadata object', () => {
    const out = metadataJsonTemplate({
      slug: 'my-course',
      titleEn: 'My course',
      descriptionEn: 'A test',
      author: 'someone',
    });
    const obj = JSON.parse(out);
    expect(obj.type).toBe('course');
    expect(obj.version).toBe('0.1.0');
    expect(obj.title).toEqual({ en: 'My course' });
    expect(obj.author).toBe('someone');
    expect(obj.license).toBe('MIT');
  });
});

describe('changelogTemplate', () => {
  it('produces a keep-a-changelog initial-release section dated today', () => {
    const out = changelogTemplate({ version: '0.1.0', isoDate: '2026-05-28' });
    expect(out).toContain('## [0.1.0] - 2026-05-28');
    expect(out).toContain('### Added');
    expect(out).toContain('Initial release');
  });
});

describe('quizJsonTemplate', () => {
  it('produces a per_chapter quiz with one placeholder question per chapter', () => {
    const out = quizJsonTemplate({ mode: 'per_chapter', chapterCount: 3 });
    const obj = JSON.parse(out);
    expect(obj.presentation).toBe('per_chapter');
    expect(obj.passing_score).toBe(0.7);
    expect(Object.keys(obj.chapters)).toEqual(['1', '2', '3']);
    expect(obj.chapters['1']).toHaveLength(1);
    expect(obj.chapters['1'][0].type).toBe('multiple_choice');
  });

  it('produces a final_exam quiz with empty chapter arrays + one placeholder final_exam question', () => {
    const out = quizJsonTemplate({ mode: 'final_exam', chapterCount: 3 });
    const obj = JSON.parse(out);
    expect(obj.presentation).toBe('final_exam');
    expect(obj.chapters['1']).toEqual([]);
    expect(obj.final_exam).toHaveLength(1);
    expect(obj.final_exam[0].id).toBe('f1');
  });

  it('produces a both quiz with one question per chapter AND one final_exam question', () => {
    const out = quizJsonTemplate({ mode: 'both', chapterCount: 2 });
    const obj = JSON.parse(out);
    expect(obj.presentation).toBe('both');
    expect(Object.keys(obj.chapters)).toEqual(['1', '2']);
    expect(obj.chapters['1']).toHaveLength(1);
    expect(obj.final_exam).toHaveLength(1);
  });

  it('every scaffold is schema-valid (parses against quizSchema without errors)', async () => {
    const { quizSchema } = await import('@skillcourse-dev/shared');
    for (const mode of ['per_chapter', 'final_exam', 'both'] as const) {
      const out = quizJsonTemplate({ mode, chapterCount: 3 });
      const result = quizSchema.safeParse(JSON.parse(out));
      expect(
        result.success,
        `mode=${mode} should be schema-valid: ${JSON.stringify(result)}`,
      ).toBe(true);
    }
  });
});
