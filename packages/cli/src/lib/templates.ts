export interface SkillMdOpts {
  name: string;
  description: string;
  locale: 'en' | 'he' | 'both';
}

export function skillMdTemplate(opts: SkillMdOpts): string {
  const companionHeading = opts.locale === 'he' ? '## סקילים נלווים' : '## Companion skills';
  return `---
name: ${opts.name}
description: ${opts.description}
license: MIT
---

## 1. First chapter

Replace this with the first chapter content. Each \`## \` heading marks a chapter.

## 2. Second chapter

Replace this with the second chapter content.

## 3. Third chapter

Replace this with the third chapter content.

${companionHeading}

- [example-skill](https://github.com/skillcourse-dev/example-skill): \`npx @skillcourse-dev/cli add example-skill\`
`;
}

export interface MetadataJsonOpts {
  slug: string;
  titleEn: string;
  descriptionEn: string;
  author: string;
  recommendedSkills?: string[];
}

export function metadataJsonTemplate(opts: MetadataJsonOpts): string {
  const obj = {
    type: 'course',
    version: '0.1.0',
    title: { en: opts.titleEn },
    description: { en: opts.descriptionEn },
    author: opts.author,
    license: 'MIT',
    recommended_skills: opts.recommendedSkills ?? ['example-skill'],
  };
  return JSON.stringify(obj, null, 2) + '\n';
}

export interface ChangelogOpts {
  version: string;
  isoDate: string;
}

export function changelogTemplate(opts: ChangelogOpts): string {
  return `## [${opts.version}] - ${opts.isoDate}
### Added
- Initial release.
`;
}

export interface QuizJsonOpts {
  mode: 'per_chapter' | 'final_exam' | 'both';
  chapterCount: number;
}

// A schema-valid placeholder question. The whole quiz scaffold must parse
// against Plan 1's quizSchema or the very next `validate` call fails.
// For final_exam and both modes, we MUST seed at least one question
// somewhere because the schema's superRefine rejects "all empty" combinations.
function placeholderQuestion(id: string): Record<string, unknown> {
  return {
    id,
    type: 'multiple_choice',
    question: { en: 'TODO: replace this with a real question.' },
    options: [
      { en: 'TODO: option A' },
      { en: 'TODO: option B' },
    ],
    answer: 0,
  };
}

export function quizJsonTemplate(opts: QuizJsonOpts): string {
  const chapters: Record<string, unknown[]> = {};
  for (let i = 1; i <= opts.chapterCount; i++) {
    chapters[String(i)] =
      opts.mode === 'final_exam' ? [] : [placeholderQuestion(`ch${i}-q1`)];
  }
  const obj: Record<string, unknown> = {
    $schema: 'https://skillcourse.dev/schema/quiz-v1.json',
    presentation: opts.mode,
    passing_score: 0.7,
    chapters,
  };
  if (opts.mode === 'final_exam' || opts.mode === 'both') {
    obj.final_exam = [placeholderQuestion('f1')];
  }
  return JSON.stringify(obj, null, 2) + '\n';
}
