import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { FilesystemRegistry } from './filesystem.adapter.js';
import { CourseNotFoundError } from './registry.adapter.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRegistry = resolve(here, '__fixtures__', 'sample-registry', 'courses');

describe('FilesystemRegistry', () => {
  let registry: FilesystemRegistry;

  beforeAll(() => {
    registry = new FilesystemRegistry({ coursesDir: fixtureRegistry });
  });

  it('list() returns summaries for alpha and beta sorted by slug', async () => {
    const summaries = await registry.list();
    expect(summaries.map((s) => s.slug)).toEqual(['alpha', 'beta']);
    expect(summaries[0]?.title.en).toBe('Alpha');
    expect(summaries[0]?.chapterCount).toBe(2);
    expect(summaries[1]?.chapterCount).toBe(1);
  });

  it('load(slug) returns the full Course object', async () => {
    const course = await registry.load('alpha');
    expect(course.slug).toBe('alpha');
    expect(course.chapters).toHaveLength(2);
    expect(course.companionSkills[0]?.slug).toBe('alpha-helper');
  });

  it('load(missing) throws CourseNotFoundError', async () => {
    await expect(registry.load('does-not-exist')).rejects.toBeInstanceOf(CourseNotFoundError);
  });

  it('repeated load() hits the cache (same Course reference) when mtime unchanged', async () => {
    const a = await registry.load('alpha');
    const b = await registry.load('alpha');
    expect(b).toBe(a);
  });

  it('list() returns empty array when coursesDir does not exist', async () => {
    const empty = new FilesystemRegistry({ coursesDir: join(here, '__missing__') });
    expect(await empty.list()).toEqual([]);
  });
});
