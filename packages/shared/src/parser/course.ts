import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { metadataSchema, type CourseMetadata } from '../schemas/metadata.js';
import { quizSchema, type Quiz } from '../schemas/quiz.js';
import { parseFrontmatter, type SkillFrontmatter } from './frontmatter.js';
import { parseChapters, type Chapter } from './chapters.js';
import { parseCompanionSkills, type CompanionSkill } from './companion-skills.js';
import { estimateChapterMinutes } from './estimated-minutes.js';

export interface ChapterWithMinutes extends Chapter {
  estimatedMinutes: number;
}

export interface Course {
  slug: string;
  dir: string;
  frontmatter: SkillFrontmatter;
  metadata: CourseMetadata;
  chapters: ChapterWithMinutes[];
  companionSkills: CompanionSkill[];
  quiz: Quiz | undefined;
  totalEstimatedMinutes: number;
}

async function readRequired(path: string, label: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${label} not found at ${path}`);
    }
    throw err;
  }
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

export async function loadCourse(courseDir: string): Promise<Course> {
  const skillMd = await readRequired(join(courseDir, 'SKILL.md'), 'SKILL.md');
  const { frontmatter, body } = parseFrontmatter(skillMd);

  const metadataRaw = await readRequired(join(courseDir, 'metadata.json'), 'metadata.json');
  const metadata = metadataSchema.parse(JSON.parse(metadataRaw));

  const chapters: ChapterWithMinutes[] = parseChapters(body).map((c) => ({
    ...c,
    estimatedMinutes: estimateChapterMinutes(c.body),
  }));

  const companionSkills = parseCompanionSkills(body);

  const quizRaw = await readOptional(join(courseDir, 'quiz.json'));
  const quiz = quizRaw ? quizSchema.parse(JSON.parse(quizRaw)) : undefined;

  const totalEstimatedMinutes = chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);

  return {
    slug: basename(courseDir),
    dir: courseDir,
    frontmatter,
    metadata,
    chapters,
    companionSkills,
    quiz,
    totalEstimatedMinutes,
  };
}
