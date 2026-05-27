import { describe, it, expect } from 'vitest';
import { PACKAGE_NAME } from './index.js';

describe('@skillcourse-dev/shared', () => {
  it('exports the package name', () => {
    expect(PACKAGE_NAME).toBe('@skillcourse-dev/shared');
  });
});
