import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadCourse, type Course } from '@skillcourse-dev/shared';
import {
  type CourseRegistryAdapter,
  type CourseSummary,
  CourseNotFoundError,
  InvalidSlugError,
} from './registry.adapter.js';

export interface FilesystemRegistryOpts {
  /** Absolute or cwd-relative path to the directory containing course folders. */
  coursesDir: string;
}

interface CacheEntry {
  course: Course;
  /** max(mtime) of every file that contributes to the parsed Course. */
  mtime: number;
}

/** Slugs are kebab-case-ish (matches our init validation). Rejecting non-conforming slugs
 *  also blocks path-traversal vectors like "../../etc/passwd". */
const VALID_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Files whose mtime can invalidate a cached Course. SKILL.md alone is not enough:
 *  authors who edit metadata.json (title, description, version, recommended_skills)
 *  or quiz.json without touching SKILL.md would otherwise see stale data. */
const CACHE_KEY_FILES = ['SKILL.md', 'metadata.json', 'quiz.json'] as const;

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
      if (!VALID_SLUG.test(name)) continue;
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
    if (!VALID_SLUG.test(slug)) {
      throw new InvalidSlugError(slug);
    }
    const courseDir = join(this.coursesDir, slug);
    const mtime = await this.courseMtime(courseDir);
    if (mtime === null) {
      throw new CourseNotFoundError(slug);
    }
    const cached = this.cache.get(slug);
    if (cached && cached.mtime === mtime) {
      return cached.course;
    }
    const course = await loadCourse(courseDir);
    this.cache.set(slug, { course, mtime });
    return course;
  }

  /** Returns max(mtimeMs) across CACHE_KEY_FILES, or null if SKILL.md does not exist
   *  (a course without SKILL.md is not a course). Missing optional files (metadata.json,
   *  quiz.json) are ignored when computing the max. */
  private async courseMtime(courseDir: string): Promise<number | null> {
    const mtimes: (number | null)[] = await Promise.all(
      CACHE_KEY_FILES.map(async (filename) => {
        try {
          const s = await stat(join(courseDir, filename));
          return s.mtimeMs;
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw err;
        }
      }),
    );
    // CACHE_KEY_FILES[0] is SKILL.md; if it's missing, the course doesn't exist.
    if (mtimes[0] === null) return null;
    let max = 0;
    for (const m of mtimes) {
      if (m !== null && m > max) max = m;
    }
    return max;
  }
}
