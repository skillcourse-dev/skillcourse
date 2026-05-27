import { describe, it, expect } from 'vitest';
import { estimateChapterMinutes } from './estimated-minutes.js';

describe('estimateChapterMinutes', () => {
  it('returns ceil(wordCount / 200) when no override is present', () => {
    const body = Array.from({ length: 250 }, () => 'word').join(' ');
    expect(estimateChapterMinutes(body)).toBe(2);
  });

  it('returns at least 1 minute for very short chapters', () => {
    expect(estimateChapterMinutes('one two three')).toBe(1);
  });

  it('honors an HTML-comment override', () => {
    expect(estimateChapterMinutes(`<!-- meta: minutes=8 -->\nactual words.`)).toBe(8);
  });

  it('ignores override comments that are malformed and does not count them as words', () => {
    expect(estimateChapterMinutes(`<!-- meta: minutes=abc -->\nfour words written here.`)).toBe(1);
  });

  it('strips all HTML comments before counting (not just the override one)', () => {
    expect(estimateChapterMinutes(`<!-- note: this is a comment -->\none two three.`)).toBe(1);
  });
});
