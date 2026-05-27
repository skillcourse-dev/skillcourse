import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCourse } from './course.js';

// Walk up from this file until we find pnpm-workspace.yaml (the repo root marker).
// Robust against this file moving within packages/shared/src/.
function findRepoRoot(start: string): string {
  let dir = start;
  while (dir !== resolve(dir, '..')) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = resolve(dir, '..');
  }
  throw new Error('pnpm-workspace.yaml not found in any ancestor of ' + start);
}

const here = dirname(fileURLToPath(import.meta.url));
const sampleDir = resolve(findRepoRoot(here), 'courses', 'hello-skillcourse');

describe('hello-skillcourse (real sample)', () => {
  it('parses without errors', async () => {
    const course = await loadCourse(sampleDir);
    expect(course.slug).toBe('hello-skillcourse');
  });

  it('finds exactly 3 chapters with the expected titles', async () => {
    const course = await loadCourse(sampleDir);
    expect(course.chapters.map((c) => c.title)).toEqual([
      'What is an agent skill?',
      'Anatomy of SKILL.md',
      'Publishing your first skill',
    ]);
  });

  it('parses 2 companion skills', async () => {
    const course = await loadCourse(sampleDir);
    expect(course.companionSkills.map((s) => s.slug)).toEqual(['skill-creator', 'skill-linter']);
  });

  it('loads the quiz with per_chapter presentation', async () => {
    const course = await loadCourse(sampleDir);
    expect(course.quiz?.presentation).toBe('per_chapter');
    expect(Object.keys(course.quiz?.chapters ?? {})).toEqual(['1', '2', '3']);
  });

  it('recommended_skills in metadata matches the Companion skills bullets', async () => {
    const course = await loadCourse(sampleDir);
    const sectionSlugs = [...course.companionSkills.map((s) => s.slug)].sort();
    const metaSlugs = [...(course.metadata.recommended_skills ?? [])].sort();
    expect(metaSlugs).toEqual(sectionSlugs);
  });
});
