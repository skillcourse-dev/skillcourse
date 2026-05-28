import type { Course, CourseSummary } from '@skillcourse-dev/shared';

// Re-export so consumers in this package can `import { ... } from './registry.adapter.js'`
// without reaching across packages. Source of truth lives in @skillcourse-dev/shared.
export type { CourseSummary };

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
