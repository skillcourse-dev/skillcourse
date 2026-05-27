export const PACKAGE_NAME = '@skillcourse-dev/shared';

export { localizedString, type LocalizedString } from './schemas/common.js';
export { metadataSchema, type CourseMetadata } from './schemas/metadata.js';
export { quizSchema, type Quiz, type QuizQuestion } from './schemas/quiz.js';
export { parseFrontmatter, type SkillFrontmatter, type ParsedSkillMd } from './parser/frontmatter.js';
