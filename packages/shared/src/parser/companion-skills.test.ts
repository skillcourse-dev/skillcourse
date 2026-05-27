import { describe, it, expect } from 'vitest';
import { parseCompanionSkills } from './companion-skills.js';

describe('parseCompanionSkills', () => {
  it('extracts bullets from the EN section', () => {
    const body = `## 1. Intro\ntext\n\n## Companion skills\n\n- [skill-a](https://x.com/skill-a): \`npx cli add skill-a\`\n- [skill-b](https://x.com/skill-b): \`npx cli add skill-b\`\n`;
    const skills = parseCompanionSkills(body);
    expect(skills).toHaveLength(2);
    expect(skills[0]).toEqual({
      slug: 'skill-a',
      label: 'skill-a',
      url: 'https://x.com/skill-a',
      installCommand: 'npx cli add skill-a',
    });
  });

  it('derives slug from the URL last path segment when label differs', () => {
    const body = `## Companion skills\n\n- [My Cool Skill](https://github.com/example/my-cool-skill): \`cmd\`\n`;
    const skills = parseCompanionSkills(body);
    expect(skills[0]?.slug).toBe('my-cool-skill');
    expect(skills[0]?.label).toBe('My Cool Skill');
  });

  it('extracts from the Hebrew section', () => {
    const body = `## 1. פתיחה\nתוכן\n\n## סקילים נלווים\n\n- [skill-a](https://x.com/skill-a): \`npx cli add skill-a\`\n`;
    expect(parseCompanionSkills(body)).toHaveLength(1);
  });

  it('returns empty array when section is absent', () => {
    expect(parseCompanionSkills('## 1. Only\nbody\n')).toEqual([]);
  });

  it('returns empty array when section is empty', () => {
    expect(parseCompanionSkills('## Companion skills\n\n(none)\n')).toEqual([]);
  });

  it('skips bullets that do not match the expected shape', () => {
    const body = `## Companion skills\n\n- random line\n- [valid](https://x.com/valid): \`cmd\`\n`;
    const skills = parseCompanionSkills(body);
    expect(skills).toHaveLength(1);
    expect(skills[0]?.slug).toBe('valid');
  });
});
