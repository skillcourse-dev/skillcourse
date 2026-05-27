// Spec is case-sensitive on the EN form ("a final H2 named exactly 'Companion skills'").
// Hebrew form has no case. Lowercase variant kept out deliberately, so a typo like
// "## companion skills" surfaces as a real chapter (loud failure beats silent skip).
const COMPANION_TITLES = new Set(['Companion skills', 'סקילים נלווים']);
const H2 = /^##\s+(.+?)\s*$/gm;
const LEADING_NUMBER = /^([\d]+(?:\.[\d]+)*\.?)\s+(.+)$/;

export interface Chapter {
  index: number;
  title: string;
  slug: string;
  body: string;
}

interface Heading {
  rawTitle: string;
  start: number;
  end: number;
}

function findHeadings(body: string): Heading[] {
  return Array.from(body.matchAll(H2)).map((m) => ({
    rawTitle: m[1] ?? '',
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }));
}

function dropCompanionSection(headings: Heading[]): Heading[] {
  const last = headings.at(-1);
  return last && COMPANION_TITLES.has(last.rawTitle.trim())
    ? headings.slice(0, -1)
    : headings;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function buildChapter(
  i: number,
  head: Heading,
  bodyEnd: number,
  fullBody: string,
): Chapter {
  const chapterBody = fullBody.slice(head.end, bodyEnd).replace(/^\n+/, '').trimEnd();
  const numberMatch = head.rawTitle.match(LEADING_NUMBER);
  const numberPart = numberMatch?.[1]?.replace(/\.$/, '') ?? '';
  const titleOnly = numberMatch?.[2] ?? head.rawTitle;
  const slugBase = numberPart ? `${numberPart}-${titleOnly}` : titleOnly;
  return {
    index: i + 1,
    title: titleOnly.trim(),
    slug: slugify(slugBase),
    body: chapterBody,
  };
}

export function parseChapters(body: string): Chapter[] {
  const all = findHeadings(body);
  const chapters = dropCompanionSection(all);
  return chapters.map((head, i) => {
    const next = all[i + 1];
    const bodyEnd = next ? next.start : body.length;
    return buildChapter(i, head, bodyEnd, body);
  });
}
