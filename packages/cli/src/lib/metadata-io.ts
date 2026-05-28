import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { metadataSchema, type CourseMetadata } from '@skillcourse-dev/shared';

/**
 * Read, parse, and schema-validate `metadata.json` in a course directory.
 * Every error message is prefixed with `metadata.json` so callers don't need
 * to attribute file paths from upstream zod messages.
 */
export async function loadValidatedMetadata(courseDir: string): Promise<CourseMetadata> {
  const path = join(courseDir, 'metadata.json');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`metadata.json not found at ${path}`);
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`metadata.json is not valid JSON: ${(err as Error).message}`);
  }

  const result = metadataSchema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`metadata.json invalid: ${detail}`);
  }

  return result.data;
}

/** Write metadata.json with stable 2-space JSON formatting + trailing newline. */
export async function writeMetadata(courseDir: string, metadata: CourseMetadata): Promise<void> {
  await writeFile(join(courseDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}
