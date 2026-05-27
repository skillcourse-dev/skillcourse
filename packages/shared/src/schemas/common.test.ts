import { describe, it, expect } from 'vitest';
import { localizedString } from './common.js';

describe('localizedString', () => {
  it('requires non-empty en', () => {
    expect(localizedString.safeParse({ en: 'hello' }).success).toBe(true);
    expect(localizedString.safeParse({ en: '' }).success).toBe(false);
    expect(localizedString.safeParse({}).success).toBe(false);
  });

  it('allows additional locales as strings', () => {
    expect(localizedString.safeParse({ en: 'hi', he: 'שלום', ar: 'مرحبا' }).success).toBe(true);
  });
});
