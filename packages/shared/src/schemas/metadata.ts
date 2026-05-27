import { z } from 'zod';
import semver from 'semver';
import { localizedString } from './common.js';

export const metadataSchema = z.object({
  type: z.literal('course'),
  version: z.string().refine(
    (v) => semver.valid(v) !== null && !v.startsWith('v'),
    { message: 'must be valid bare semver, no leading "v" (https://semver.org)' },
  ),
  title: localizedString,
  description: localizedString,
  estimated_minutes: z.number().int().positive().optional(),
  chapter_count: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  cover_image: z.string().optional(),
  author: z.string().min(1),
  license: z.string().min(1),
  recommended_skills: z.array(z.string()).optional(),
}).strict();

export type CourseMetadata = z.infer<typeof metadataSchema>;
