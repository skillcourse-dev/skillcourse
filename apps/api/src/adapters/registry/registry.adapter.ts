import type { Course, CourseMetadata } from '@skillcourse-dev/shared';

/**
 * CourseRegistryAdapter is the source-of-truth abstraction for "where do courses live?".
 * Plan 3 ships the FilesystemRegistry default. Plan 8 will add a GitRegistry.
 */
export interface CourseRegistryAdapter {
  /** Returns the slugs and titles of every course this registry knows about. Cheap, no body content. */
  list(): Promise<CourseSummary[]>;
  /** Returns the fully-parsed Course for a single slug. Throws CourseNotFoundError if absent. */
  load(slug: string): Promise<Course>;
}

// Structural aliases to whatever LocalizedString shape lives in @skillcourse-dev/shared.
// Avoids re-declaring an index signature that may not satisfy the source type
// under exactOptionalPropertyTypes + noUncheckedIndexedAccess.
export interface CourseSummary {
  slug: string;
  title: CourseMetadata['title'];
  description: CourseMetadata['description'];
  version: string;
  chapterCount: number;
  estimatedMinutes: number;
}

export const COURSE_REGISTRY_ADAPTER = Symbol('COURSE_REGISTRY_ADAPTER');

export class CourseNotFoundError extends Error {
  constructor(public readonly slug: string) {
    super(`course not found: ${slug}`);
    this.name = 'CourseNotFoundError';
  }
}

export class InvalidSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`invalid course slug: ${slug} (must be kebab-case, lowercase letters/digits/hyphens only)`);
    this.name = 'InvalidSlugError';
  }
}
