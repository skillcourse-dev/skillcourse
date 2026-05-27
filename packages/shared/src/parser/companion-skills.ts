const SECTION_TITLES = new Set(['Companion skills', 'סקילים נלווים']);
const BULLET = /^\s*-\s+\[([^\]]+)\]\(([^)]+)\)\s*[:,]\s*`([^`]+)`/;

export interface CompanionSkill {
  slug: string;       // derived from URL last path segment (canonical); falls back to slugified label
  label: string;      // the literal markdown link text, as authored
  url: string;
  installCommand: string;
}

function deriveSlug(label: string, url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).at(-1);
    if (last) return last.toLowerCase();
  } catch {
    // not a valid URL; fall through to label-based slug
  }
  return label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

export function parseCompanionSkills(body: string): CompanionSkill[] {
  const lines = body.split('\n');
  const start = lines.findIndex((line) => {
    const m = line.match(/^##\s+(.+?)\s*$/);
    return m !== null && SECTION_TITLES.has((m[1] ?? '').trim());
  });
  if (start < 0) return [];

  const out: CompanionSkill[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^##\s+/.test(line)) break;
    const m = line.match(BULLET);
    if (m) {
      const label = m[1] ?? '';
      const url = m[2] ?? '';
      out.push({
        slug: deriveSlug(label, url),
        label,
        url,
        installCommand: m[3] ?? '',
      });
    }
  }
  return out;
}
