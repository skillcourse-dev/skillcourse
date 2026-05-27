import { describe, it, expect } from 'vitest';
import { quizSchema } from './quiz.js';

const VALID_MCQ = {
  id: 'q1',
  type: 'multiple_choice',
  question: { en: 'Q?' },
  options: [{ en: 'a' }, { en: 'b' }],
  answer: 0,
};

const VALID_SHORT = {
  id: 'q2',
  type: 'short_answer',
  question: { en: 'Q?' },
  rubric: { en: 'rubric text' },
};

describe('quizSchema', () => {
  it('accepts a per_chapter quiz with one MCQ', () => {
    expect(quizSchema.safeParse({
      presentation: 'per_chapter',
      chapters: { '1': [VALID_MCQ] },
    }).success).toBe(true);
  });

  it('defaults passing_score to 0.7', () => {
    const result = quizSchema.safeParse({
      presentation: 'per_chapter',
      chapters: { '1': [VALID_MCQ] },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.passing_score).toBe(0.7);
  });

  it('accepts final_exam mode with a final_exam array', () => {
    expect(quizSchema.safeParse({
      presentation: 'final_exam',
      chapters: {},
      final_exam: [VALID_MCQ, VALID_SHORT],
    }).success).toBe(true);
  });

  it('accepts final_exam mode without final_exam if chapters has questions (auto-shuffle source)', () => {
    expect(quizSchema.safeParse({
      presentation: 'final_exam',
      chapters: { '1': [VALID_MCQ] },
    }).success).toBe(true);
  });

  it('rejects final_exam mode with no question source at all', () => {
    expect(quizSchema.safeParse({
      presentation: 'final_exam',
      chapters: {},
    }).success).toBe(false);
  });

  it('rejects both mode with empty chapters', () => {
    expect(quizSchema.safeParse({
      presentation: 'both',
      chapters: {},
      final_exam: [VALID_MCQ],
    }).success).toBe(false);
  });

  it('rejects both mode with no final_exam', () => {
    expect(quizSchema.safeParse({
      presentation: 'both',
      chapters: { '1': [VALID_MCQ] },
    }).success).toBe(false);
  });

  it('accepts both mode with both sources non-empty', () => {
    expect(quizSchema.safeParse({
      presentation: 'both',
      chapters: { '1': [VALID_MCQ] },
      final_exam: [VALID_MCQ],
    }).success).toBe(true);
  });

  it('rejects MCQ with answer out of range', () => {
    expect(quizSchema.safeParse({
      presentation: 'per_chapter',
      chapters: { '1': [{ ...VALID_MCQ, answer: 5 }] },
    }).success).toBe(false);
  });

  it('rejects MCQ with fewer than 2 options', () => {
    expect(quizSchema.safeParse({
      presentation: 'per_chapter',
      chapters: { '1': [{ ...VALID_MCQ, options: [{ en: 'only' }], answer: 0 }] },
    }).success).toBe(false);
  });

  it('rejects short_answer missing rubric', () => {
    expect(quizSchema.safeParse({
      presentation: 'per_chapter',
      chapters: { '1': [{ id: 'q', type: 'short_answer', question: { en: 'Q?' } }] },
    }).success).toBe(false);
  });

  it('rejects unknown presentation mode', () => {
    expect(quizSchema.safeParse({
      presentation: 'wat',
      chapters: {},
    }).success).toBe(false);
  });
});
