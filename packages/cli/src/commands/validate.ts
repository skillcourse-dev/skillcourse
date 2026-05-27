import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import {
  loadCourse,
  metadataSchema,
  quizSchema,
  parseFrontmatter,
  parseChapters,
  parseCompanionSkills,
} from '@skillcourse-dev/shared';
import {
  checkChangelogVersionMatch,
  checkNoEmDashes,
  checkRecommendedSkillsDrift,
  checkLinkResolution,
} from '../lib/checks.js';

export interface ValidationError {
  file?: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

export interface ValidateOpts {
  courseDir: string;
}

async function pathExistsRelativeTo(dir: string): Promise<(relative: string) => Promise<boolean>> {
  return async (relative: string) => {
    try {
      await access(join(dir, relative));
      return true;
    } catch {
      return false;
    }
  };
}

async function readFileWithErr(
  path: string,
  fileLabel: string,
): Promise<{ content: string } | { error: string }> {
  try {
    return { content: await readFile(path, 'utf8') };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { error: `${fileLabel} not found` };
    return { error: `${fileLabel} read failed: ${(err as Error).message}` };
  }
}

export async function runValidate(opts: ValidateOpts): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Stage 1: SKILL.md
  const skillRead = await readFileWithErr(join(opts.courseDir, 'SKILL.md'), 'SKILL.md');
  if ('error' in skillRead) {
    errors.push({ file: 'SKILL.md', message: skillRead.error });
    return { ok: false, errors };
  }
  let frontmatter: ReturnType<typeof parseFrontmatter>['frontmatter'];
  let body: string;
  try {
    const parsed = parseFrontmatter(skillRead.content);
    frontmatter = parsed.frontmatter;
    body = parsed.body;
  } catch (err) {
    errors.push({ file: 'SKILL.md', message: (err as Error).message });
    return { ok: false, errors };
  }
  void frontmatter;

  // Stage 2: metadata.json
  const metaRead = await readFileWithErr(join(opts.courseDir, 'metadata.json'), 'metadata.json');
  if ('error' in metaRead) {
    errors.push({ file: 'metadata.json', message: metaRead.error });
    return { ok: false, errors };
  }
  let metaJson: unknown;
  try {
    metaJson = JSON.parse(metaRead.content);
  } catch (err) {
    errors.push({ file: 'metadata.json', message: `not valid JSON: ${(err as Error).message}` });
    return { ok: false, errors };
  }
  const metaResult = metadataSchema.safeParse(metaJson);
  if (!metaResult.success) {
    errors.push({
      file: 'metadata.json',
      message: metaResult.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    });
    return { ok: false, errors };
  }
  const metadata = metaResult.data;

  // Stage 3: quiz.json (optional)
  let quiz: ReturnType<typeof quizSchema.parse> | undefined;
  const quizRead = await readFileWithErr(join(opts.courseDir, 'quiz.json'), 'quiz.json');
  if ('content' in quizRead) {
    let quizJson: unknown;
    try {
      quizJson = JSON.parse(quizRead.content);
    } catch (err) {
      errors.push({ file: 'quiz.json', message: `not valid JSON: ${(err as Error).message}` });
      return { ok: false, errors };
    }
    const quizResult = quizSchema.safeParse(quizJson);
    if (!quizResult.success) {
      errors.push({
        file: 'quiz.json',
        message: quizResult.error.issues
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; '),
      });
      return { ok: false, errors };
    }
    quiz = quizResult.data;
  }
  void quiz;

  // Stage 4: derived data (for structural checks below)
  const companionSkills = parseCompanionSkills(body);
  void parseChapters;
  void loadCourse; // re-exported imports kept for clarity even if not used directly

  // Stage 5: CHANGELOG.md
  const changelogRead = await readFileWithErr(join(opts.courseDir, 'CHANGELOG.md'), 'CHANGELOG.md');
  if ('error' in changelogRead) {
    errors.push({ file: 'CHANGELOG.md', message: 'CHANGELOG.md not found (required by spec)' });
    return { ok: false, errors };
  }
  const versionMismatch = checkChangelogVersionMatch(changelogRead.content, metadata.version);
  if (versionMismatch) errors.push({ file: 'CHANGELOG.md', message: versionMismatch });

  // Stage 6: structural checks on SKILL.md body
  const emDash = checkNoEmDashes(skillRead.content);
  if (emDash) errors.push({ file: 'SKILL.md', message: emDash });

  const metaSlugs = metadata.recommended_skills ?? [];
  const sectionSlugs = companionSkills.map((s) => s.slug);
  const drift = checkRecommendedSkillsDrift(metaSlugs, sectionSlugs);
  if (drift) errors.push({ file: 'SKILL.md', message: drift });

  const exists = await pathExistsRelativeTo(opts.courseDir);
  const missing = await checkLinkResolution(skillRead.content, exists);
  for (const path of missing) {
    errors.push({ file: 'SKILL.md', message: `broken relative link or image: ${path}` });
  }

  return { ok: errors.length === 0, errors };
}

export function registerValidate(program: Command): void {
  program
    .command('validate [path]')
    .description('Validate a course folder (default: cwd)')
    .action(async (path: string | undefined) => {
      const courseDir = path ?? process.cwd();
      const result = await runValidate({ courseDir });

      if (result.ok) {
        console.log(pc.green('✓ valid'));
        return;
      }

      console.log(pc.red(`✗ ${result.errors.length} error(s):`));
      for (const e of result.errors) {
        const prefix = e.file ? pc.dim(`[${e.file}]`) + ' ' : '';
        console.log(`  ${prefix}${e.message}`);
      }
      process.exit(1);
    });
}
