import matter from 'gray-matter';
import { z } from 'zod';

const frontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  license: z.string().min(1),
}).strict();

export type SkillFrontmatter = z.infer<typeof frontmatterSchema>;

export interface ParsedSkillMd {
  frontmatter: SkillFrontmatter;
  body: string;
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`)
    .join('\n');
}

export function parseFrontmatter(markdown: string): ParsedSkillMd {
  const parsed = matter(markdown);
  if (Object.keys(parsed.data).length === 0) {
    throw new Error('SKILL.md is missing YAML frontmatter');
  }
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(`SKILL.md frontmatter invalid:\n${formatZodError(result.error)}`);
  }
  return { frontmatter: result.data, body: parsed.content };
}
