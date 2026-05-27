export const PACKAGE_NAME = '@skillcourse-dev/shared';

export { localizedString, type LocalizedString } from './schemas/common.js';
export { metadataSchema, type CourseMetadata } from './schemas/metadata.js';
export { quizSchema, type Quiz, type QuizQuestion } from './schemas/quiz.js';
export { parseFrontmatter, type SkillFrontmatter, type ParsedSkillMd } from './parser/frontmatter.js';
export { parseChapters, type Chapter } from './parser/chapters.js';
export { parseCompanionSkills, type CompanionSkill } from './parser/companion-skills.js';
export { estimateChapterMinutes } from './parser/estimated-minutes.js';
export { loadCourse, type Course, type ChapterWithMinutes } from './parser/course.js';
