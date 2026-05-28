import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import { parseFrontmatter, parseChapters } from '@skillcourse-dev/shared';
import { quizJsonTemplate } from '../lib/templates.js';

export type QuizMode = 'per_chapter' | 'final_exam' | 'both';

export interface QuizInitOpts {
  courseDir: string;
  mode: QuizMode;
  force?: boolean;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runQuizInit(opts: QuizInitOpts): Promise<void> {
  const skillPath = join(opts.courseDir, 'SKILL.md');
  let skillMd: string;
  try {
    skillMd = await readFile(skillPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`SKILL.md not found at ${skillPath}`);
    }
    throw err;
  }

  const { body } = parseFrontmatter(skillMd);
  const chapters = parseChapters(body);

  const quizPath = join(opts.courseDir, 'quiz.json');
  if ((await pathExists(quizPath)) && !opts.force) {
    throw new Error(`quiz.json already exists at ${quizPath} (use --force to overwrite)`);
  }

  const quiz = quizJsonTemplate({ mode: opts.mode, chapterCount: chapters.length });
  await writeFile(quizPath, quiz, 'utf8');
}

export function registerQuizInit(program: Command): void {
  const quiz = program.command('quiz').description('Quiz subcommands');

  quiz
    .command('init [path]')
    .description('Scaffold quiz.json mirroring the chapter structure of SKILL.md. Default path: cwd.')
    .option('--mode <mode>', 'per_chapter | final_exam | both', 'per_chapter')
    .option('--force', 'Overwrite an existing quiz.json', false)
    .action(async (path: string | undefined, options: { mode?: QuizMode; force?: boolean }) => {
      const courseDir = path ?? process.cwd();
      await runQuizInit({
        courseDir,
        mode: options.mode ?? 'per_chapter',
        force: options.force ?? false,
      });
      console.log(pc.green(`✓ scaffolded ${join(courseDir, 'quiz.json')}`));
    });
}
