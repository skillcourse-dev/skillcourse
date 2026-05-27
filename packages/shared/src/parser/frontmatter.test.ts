import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from './frontmatter.js';

describe('parseFrontmatter', () => {
  it('extracts the three spec fields and returns the body', () => {
    const md = `---
name: my-course
description: A test
license: MIT
---

## 1. Intro
Hello.
`;
    const { frontmatter, body } = parseFrontmatter(md);
    expect(frontmatter).toEqual({ name: 'my-course', description: 'A test', license: 'MIT' });
    expect(body.trim()).toBe('## 1. Intro\nHello.');
  });

  it('rejects markdown with no frontmatter', () => {
    expect(() => parseFrontmatter('# just markdown')).toThrow(/frontmatter/i);
  });

  it('rejects missing required fields', () => {
    expect(() => parseFrontmatter(`---\nname: x\n---\nbody`)).toThrow(/SKILL\.md frontmatter/);
  });

  it('rejects non-spec frontmatter keys', () => {
    const md = `---\nname: c\ndescription: d\nlicense: MIT\nextra: bad\n---\nbody`;
    expect(() => parseFrontmatter(md)).toThrow(/SKILL\.md frontmatter/);
  });
});
