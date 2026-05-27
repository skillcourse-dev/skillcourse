import { describe, it, expect } from 'vitest';
import { metadataSchema } from './metadata.js';

const VALID = {
  type: 'course',
  version: '1.0.0',
  title: { en: 'Writing your first agent skill' },
  description: { en: 'A 3-chapter intro.' },
  estimated_minutes: 35,
  chapter_count: 3,
  tags: ['beginner'],
  cover_image: 'cover.png',
  author: 'skillcourse-dev',
  license: 'MIT',
  recommended_skills: ['skill-creator'],
};

describe('metadataSchema', () => {
  it('accepts a valid course metadata object', () => {
    expect(metadataSchema.safeParse(VALID).success).toBe(true);
  });

  it('requires type to be exactly "course"', () => {
    expect(metadataSchema.safeParse({ ...VALID, type: 'skill' }).success).toBe(false);
  });

  it('rejects invalid semver versions', () => {
    expect(metadataSchema.safeParse({ ...VALID, version: '1.0' }).success).toBe(false);
    expect(metadataSchema.safeParse({ ...VALID, version: 'one.two.three' }).success).toBe(false);
  });

  it('rejects v-prefixed semver (canonical form only)', () => {
    expect(metadataSchema.safeParse({ ...VALID, version: 'v1.0.0' }).success).toBe(false);
  });

  it('accepts pre-release semver', () => {
    expect(metadataSchema.safeParse({ ...VALID, version: '1.0.0-alpha.1' }).success).toBe(true);
  });

  it('allows optional fields to be omitted', () => {
    const minimal = {
      type: 'course',
      version: '0.1.0',
      title: { en: 'T' },
      description: { en: 'D' },
      author: 'a',
      license: 'MIT',
    };
    expect(metadataSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects unknown extra fields (no evidence, no judge, etc.)', () => {
    expect(metadataSchema.safeParse({ ...VALID, evidence: {} }).success).toBe(false);
  });
});
