import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadCourse, type Course } from '@skillcourse-dev/shared';
import {
  type CourseRegistryAdapter,
  type CourseSummary,
  CourseNotFoundError,
} from './registry.adapter.js';

export interface FilesystemRegistryOpts {
  /** Absolute or cwd-relative path to the directory containing course folders. */
  coursesDir: string;
}

interface CacheEntry {
  course: Course;
  mtime: number;
}

/**
 * FilesystemRegistry: reads `<coursesDir>/<slug>/` folders. Each must be a valid
 * Anthropic Skill folder (SKILL.md + metadata.json + CHANGELOG.md). Uses an
 * mtime-keyed in-memory cache so repeated reads do not re-parse unchanged files.
 */
export class FilesystemRegistry implements CourseRegistryAdapter {
  private readonly coursesDir: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(opts: FilesystemRegistryOpts) {
    this.coursesDir = opts.coursesDir;
  }

  async list(): Promise<CourseSummary[]> {
    const entries = await readdir(this.coursesDir, { withFileTypes: true }).catch(
      () => [] as Awaited<ReturnType<typeof readdir>>,
    );
    const summaries: CourseSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = typeof entry.name === 'string' ? entry.name : entry.name.toString('utf8');
      try {
        const course = await this.load(name);
        summaries.push({
          slug: course.slug,
          title: course.metadata.title,
          description: course.metadata.description,
          version: course.metadata.version,
          chapterCount: course.chapters.length,
          estimatedMinutes: course.totalEstimatedMinutes,
        });
      } catch {
        // Skip folders that fail to parse; surfacing them as 500s on list()
        // would block the whole endpoint. They DO error if you GET them directly.
      }
    }
    return summaries.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  async load(slug: string): Promise<Course> {
    const courseDir = join(this.coursesDir, slug);
    const skillMtime = await this.skillMtime(courseDir);
    if (skillMtime === null) {
      throw new CourseNotFoundError(slug);
    }
    const cached = this.cache.get(slug);
    if (cached && cached.mtime === skillMtime) {
      return cached.course;
    }
    const course = await loadCourse(courseDir);
    this.cache.set(slug, { course, mtime: skillMtime });
    return course;
  }

  private async skillMtime(courseDir: string): Promise<number | null> {
    try {
      const s = await stat(join(courseDir, 'SKILL.md'));
      return s.mtimeMs;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }
}
