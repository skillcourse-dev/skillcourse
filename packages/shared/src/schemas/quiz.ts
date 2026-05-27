import { z } from 'zod';
import { localizedString } from './common.js';

const mcq = z.object({
  id: z.string().min(1),
  type: z.literal('multiple_choice'),
  question: localizedString,
  options: z.array(localizedString).min(2),
  answer: z.number().int().nonnegative(),
  explanation: localizedString.optional(),
}).strict();

const shortAnswer = z.object({
  id: z.string().min(1),
  type: z.literal('short_answer'),
  question: localizedString,
  rubric: localizedString,
}).strict();

const question = z.discriminatedUnion('type', [mcq, shortAnswer]);

export type QuizQuestion = z.infer<typeof question>;

function validateQuestions(
  questions: QuizQuestion[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q?.type === 'multiple_choice' && q.answer >= q.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answer index out of range',
        path: [...pathPrefix, i, 'answer'],
      });
    }
  }
}

export const quizSchema = z.object({
  $schema: z.string().optional(),
  presentation: z.enum(['per_chapter', 'final_exam', 'both']),
  passing_score: z.number().min(0).max(1).default(0.7),
  chapters: z.record(z.string(), z.array(question)),
  final_exam: z.array(question).optional(),
}).strict().superRefine((quiz, ctx) => {
  const hasFinalArray = (quiz.final_exam?.length ?? 0) > 0;
  const hasChapterQuestions = Object.values(quiz.chapters).some((arr) => arr.length > 0);

  if (quiz.presentation === 'final_exam' && !hasFinalArray && !hasChapterQuestions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'final_exam presentation requires either a final_exam array or at least one chapter question',
      path: ['final_exam'],
    });
  }

  if (quiz.presentation === 'both') {
    if (!hasChapterQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'both presentation requires at least one chapter question',
        path: ['chapters'],
      });
    }
    if (!hasFinalArray) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'both presentation requires a non-empty final_exam array',
        path: ['final_exam'],
      });
    }
  }

  for (const [chapterKey, questions] of Object.entries(quiz.chapters)) {
    validateQuestions(questions, ctx, ['chapters', chapterKey]);
  }
  if (quiz.final_exam) {
    validateQuestions(quiz.final_exam, ctx, ['final_exam']);
  }
});

export type Quiz = z.infer<typeof quizSchema>;
