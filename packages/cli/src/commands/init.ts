import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  skillMdTemplate,
  metadataJsonTemplate,
  changelogTemplate,
  quizJsonTemplate,
} from '../lib/templates.js';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface InitOpts {
  slug: string;
  title: string;
  description: string;
  locale: 'en' | 'he' | 'both';
  author: string;
  addQuiz: boolean;
  quizMode?: 'per_chapter' | 'final_exam' | 'both';
  cwd?: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runInit(opts: InitOpts): Promise<void> {
  if (!SLUG_REGEX.test(opts.slug)) {
    throw new Error(
      `slug "${opts.slug}" must be kebab-case (lowercase letters, digits, and hyphens; no leading/trailing hyphen)`,
    );
  }

  const cwd = opts.cwd ?? process.cwd();
  const courseDir = join(cwd, 'courses', opts.slug);

  if (await pathExists(courseDir)) {
    throw new Error(`course folder already exists: ${courseDir}`);
  }

  await mkdir(courseDir, { recursive: true });

  const skillEn = skillMdTemplate({
    name: opts.slug,
    description: opts.description,
    locale: opts.locale === 'both' ? 'en' : opts.locale,
  });
  await writeFile(join(courseDir, 'SKILL.md'), skillEn, 'utf8');

  if (opts.locale === 'both') {
    const skillHe = skillMdTemplate({
      name: opts.slug,
      description: opts.description,
      locale: 'he',
    });
    await writeFile(join(courseDir, 'SKILL_HE.md'), skillHe, 'utf8');
  }

  const metadata = metadataJsonTemplate({
    slug: opts.slug,
    titleEn: opts.title,
    descriptionEn: opts.description,
    author: opts.author,
  });
  await writeFile(join(courseDir, 'metadata.json'), metadata, 'utf8');

  const changelog = changelogTemplate({ version: '0.1.0', isoDate: isoToday() });
  await writeFile(join(courseDir, 'CHANGELOG.md'), changelog, 'utf8');

  if (opts.addQuiz) {
    const quiz = quizJsonTemplate({
      mode: opts.quizMode ?? 'per_chapter',
      chapterCount: 3,
    });
    await writeFile(join(courseDir, 'quiz.json'), quiz, 'utf8');
  }
}

async function gatherOptsInteractively(slug: string): Promise<InitOpts> {
  p.intro(pc.bgCyan(pc.black(' skill-course init ')));

  const result = await p.group(
    {
      title: () => p.text({ message: 'Title (en):', validate: (v) => (v ? undefined : 'required') }),
      description: () =>
        p.text({ message: 'Description (en):', validate: (v) => (v ? undefined : 'required') }),
      locale: () =>
        p.select({
          message: 'Locale:',
          options: [
            { value: 'en', label: 'English only' },
            { value: 'he', label: 'Hebrew only' },
            { value: 'both', label: 'Both (en + he)' },
          ],
          initialValue: 'en' as const,
        }),
      author: () =>
        p.text({
          message: 'Author:',
          validate: (v) => (v ? undefined : 'required'),
        }),
      addQuiz: () => p.confirm({ message: 'Add quiz.json?', initialValue: true }),
      quizMode: ({ results }) =>
        results.addQuiz
          ? p.select({
              message: 'Quiz mode:',
              options: [
                { value: 'per_chapter', label: 'Per-chapter (default)' },
                { value: 'final_exam', label: 'Final exam only' },
                { value: 'both', label: 'Both' },
              ],
              initialValue: 'per_chapter' as const,
            })
          : Promise.resolve('per_chapter' as const),
    },
    {
      onCancel: () => {
        p.cancel('Cancelled.');
        process.exit(0);
      },
    },
  );

  return {
    slug,
    title: result.title as string,
    description: result.description as string,
    locale: result.locale as 'en' | 'he' | 'both',
    author: result.author as string,
    addQuiz: result.addQuiz as boolean,
    quizMode: result.quizMode as 'per_chapter' | 'final_exam' | 'both',
  };
}

export function registerInit(program: Command): void {
  program
    .command('init <slug>')
    .description('Scaffold a new course folder under ./courses/<slug>')
    .option('--title <title>', 'Title in English')
    .option('--description <description>', 'Description in English')
    .option('--locale <locale>', 'en | he | both', 'en')
    .option('--author <author>', 'Author name')
    .option('--no-quiz', 'Skip quiz.json scaffolding')
    .option('--quiz-mode <mode>', 'per_chapter | final_exam | both', 'per_chapter')
    .action(async (slug: string, options: Record<string, unknown>) => {
      const allProvided =
        typeof options.title === 'string' &&
        typeof options.description === 'string' &&
        typeof options.author === 'string';

      const opts: InitOpts = allProvided
        ? {
            slug,
            title: options.title as string,
            description: options.description as string,
            locale: (options.locale as 'en' | 'he' | 'both') ?? 'en',
            author: options.author as string,
            addQuiz: options.quiz !== false,
            quizMode: (options.quizMode as 'per_chapter' | 'final_exam' | 'both') ?? 'per_chapter',
          }
        : await gatherOptsInteractively(slug);

      await runInit(opts);
      p.outro(pc.green(`✓ Scaffolded ./courses/${slug}`));
    });
}
