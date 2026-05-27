import { describe, it, expect } from 'vitest';
import { parseChapters } from './chapters.js';

describe('parseChapters', () => {
  it('extracts H2 headings as chapters in document order', () => {
    const body = `## 1. Intro\nWelcome.\n\n## 2. Anatomy\nStuff.\n\n## 3. Publishing\nMore.\n`;
    const chapters = parseChapters(body);
    expect(chapters.map((c) => c.title)).toEqual(['Intro', 'Anatomy', 'Publishing']);
    expect(chapters[0]?.slug).toBe('1-intro');
  });

  it('strips leading numbering from title but preserves it in slug', () => {
    const chapters = parseChapters(`## 1.5 Setup\ncontent\n`);
    expect(chapters[0]?.title).toBe('Setup');
    expect(chapters[0]?.slug).toBe('1-5-setup');
  });

  it('handles titles without leading numbering', () => {
    const chapters = parseChapters(`## Welcome\nintro\n## Recap\nend\n`);
    expect(chapters[0]?.slug).toBe('welcome');
    expect(chapters[1]?.slug).toBe('recap');
  });

  it('produces a Hebrew slug from a Hebrew title', () => {
    const chapters = parseChapters(`## 1. פתיחה\nתוכן\n`);
    expect(chapters[0]?.title).toBe('פתיחה');
    expect(chapters[0]?.slug).toBe('1-פתיחה');
  });

  it('skips a trailing "Companion skills" H2 (en)', () => {
    const body = `## 1. Intro\ncontent\n## Companion skills\n- list\n`;
    const chapters = parseChapters(body);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]?.title).toBe('Intro');
  });

  it('skips a trailing Hebrew "סקילים נלווים" H2', () => {
    const body = `## 1. פתיחה\nתוכן\n## סקילים נלווים\n- רשימה\n`;
    const chapters = parseChapters(body);
    expect(chapters).toHaveLength(1);
  });

  it('captures chapter body between headings, trimmed', () => {
    const body = `## 1. A\nbody of A\nspans lines\n## 2. B\nbody of B\n`;
    const chapters = parseChapters(body);
    expect(chapters[0]?.body).toBe('body of A\nspans lines');
    expect(chapters[1]?.body).toBe('body of B');
  });

  it('treats H3 and below as part of the parent chapter', () => {
    const body = `## 1. A\nintro\n### sub\ndetail\n## 2. B\nnothing\n`;
    const chapters = parseChapters(body);
    expect(chapters[0]?.body).toContain('### sub');
  });

  it('returns empty array when no H2 headings exist', () => {
    expect(parseChapters('plain text\n')).toEqual([]);
  });

  it('does NOT skip a "Companion skills" H2 when it is not the trailing heading', () => {
    const body = `## Companion skills\nmislabeled, treated as chapter\n## 1. Real chapter\nbody\n`;
    const chapters = parseChapters(body);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]?.title).toBe('Companion skills');
    expect(chapters[1]?.title).toBe('Real chapter');
  });
});
