import type { CourseMetadata } from '../schemas/metadata.js';

/** Lightweight summary served by the registry's list() endpoint. No chapter bodies. */
export interface CourseSummary {
  slug: string;
  title: CourseMetadata['title'];
  description: CourseMetadata['description'];
  version: string;
  chapterCount: number;
  estimatedMinutes: number;
}
