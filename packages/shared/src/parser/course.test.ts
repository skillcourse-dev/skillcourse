import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCourse } from './course.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string) => join(here, '__fixtures__', name);

describe('loadCourse', () => {
  it('loads the minimal fixture into a structured Course', async () => {
    const course = await loadCourse(fx('minimal-course'));

    expect(course.slug).toBe('minimal-course');
    expect(course.frontmatter.name).toBe('minimal-course');
    expect(course.metadata.type).toBe('course');
    expect(course.chapters).toHaveLength(2);
    expect(course.chapters[0]?.title).toBe('Intro');
    expect(course.chapters[0]?.estimatedMinutes).toBe(1);
    expect(course.companionSkills[0]?.slug).toBe('skill-creator');
    expect(course.quiz).toBeUndefined();
    expect(course.totalEstimatedMinutes).toBeGreaterThanOrEqual(2);
  });

  it('throws a clear error when SKILL.md is missing', async () => {
    await expect(loadCourse('/nonexistent/path/xyz')).rejects.toThrow(/SKILL\.md/);
  });

  it('throws a clear error when metadata.json is missing', async () => {
    await expect(loadCourse(fx('missing-metadata'))).rejects.toThrow(/metadata\.json/);
  });

  it('throws a clear error when metadata.json fails schema validation', async () => {
    await expect(loadCourse(fx('bad-metadata'))).rejects.toThrow();
  });

  it('parses final_exam quiz mode', async () => {
    const course = await loadCourse(fx('final-exam-course'));
    expect(course.quiz?.presentation).toBe('final_exam');
    expect(course.quiz?.final_exam).toHaveLength(1);
  });
});
