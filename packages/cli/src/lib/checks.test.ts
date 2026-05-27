import { describe, it, expect } from 'vitest';
import {
  checkChangelogVersionMatch,
  checkNoEmDashes,
  checkRecommendedSkillsDrift,
  checkLinkResolution,
} from './checks.js';

describe('checkChangelogVersionMatch', () => {
  it('passes when top entry version matches metadata version', () => {
    const changelog = `## [1.2.0] - 2026-05-28\n### Added\n- foo\n`;
    expect(checkChangelogVersionMatch(changelog, '1.2.0')).toBeUndefined();
  });

  it('fails when top entry version differs', () => {
    const changelog = `## [0.9.0] - 2026-05-28\n### Added\n- foo\n`;
    expect(checkChangelogVersionMatch(changelog, '1.0.0')).toMatch(/0\.9\.0.*1\.0\.0/);
  });

  it('fails when no version section found', () => {
    expect(checkChangelogVersionMatch('no entries here', '1.0.0')).toMatch(/no.*version.*section/i);
  });
});

describe('checkNoEmDashes', () => {
  it('passes for clean markdown', () => {
    expect(checkNoEmDashes('clean text, no dashes')).toBeUndefined();
  });

  it('reports the line number of the offending em-dash', () => {
    const result = checkNoEmDashes('line 1\nline two — has dash\nline 3');
    expect(result).toMatch(/line 2/);
  });
});

describe('checkRecommendedSkillsDrift', () => {
  it('passes when sets match', () => {
    expect(checkRecommendedSkillsDrift(['a', 'b'], ['a', 'b'])).toBeUndefined();
    expect(checkRecommendedSkillsDrift(['b', 'a'], ['a', 'b'])).toBeUndefined();
  });

  it('reports when metadata is missing entries present in companion section', () => {
    const result = checkRecommendedSkillsDrift(['a'], ['a', 'b']);
    expect(result).toMatch(/b/);
  });

  it('reports when companion section is missing entries present in metadata', () => {
    const result = checkRecommendedSkillsDrift(['a', 'c'], ['a']);
    expect(result).toMatch(/c/);
  });
});

describe('checkLinkResolution', () => {
  it('passes when all relative paths exist', async () => {
    const present = (path: string) =>
      Promise.resolve(['cover.png', 'references/foo.md'].includes(path));
    const result = await checkLinkResolution(
      '![cover](cover.png)\n[foo](references/foo.md)',
      present,
    );
    expect(result).toEqual([]);
  });

  it('reports a missing relative path', async () => {
    const present = (_: string) => Promise.resolve(false);
    const result = await checkLinkResolution('[broken](missing.md)', present);
    expect(result).toEqual(['missing.md']);
  });

  it('ignores absolute URLs', async () => {
    const present = (_: string) => Promise.resolve(false);
    const result = await checkLinkResolution(
      '[ext](https://example.com)\n[ok](mailto:a@b.com)',
      present,
    );
    expect(result).toEqual([]);
  });
});
