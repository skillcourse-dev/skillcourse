const CHANGELOG_TOP_VERSION = /^##\s+\[([^\]]+)\]/m;
const EM_DASH = /—/g;
const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const IMAGE_LINK = /!\[([^\]]*)\]\(([^)]+)\)/g;
const ABSOLUTE_URL = /^(https?:|mailto:|tel:|#)/;

export function checkChangelogVersionMatch(
  changelog: string,
  metadataVersion: string,
): string | undefined {
  const match = changelog.match(CHANGELOG_TOP_VERSION);
  if (!match) return 'CHANGELOG.md has no version section heading like "## [x.y.z]"';
  const top = match[1];
  if (top !== metadataVersion) {
    return `CHANGELOG.md top entry version ${top} does not match metadata.json version ${metadataVersion}`;
  }
  return undefined;
}

export function checkNoEmDashes(text: string): string | undefined {
  const lines = text.split('\n');
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    EM_DASH.lastIndex = 0;
    if (EM_DASH.test(lines[i] ?? '')) {
      hits.push(i + 1);
    }
  }
  if (hits.length === 0) return undefined;
  return `em-dash (U+2014) found on line ${hits.join(', line ')}; replace with comma, colon, or period`;
}

export function checkRecommendedSkillsDrift(
  metaSlugs: string[],
  sectionSlugs: string[],
): string | undefined {
  const metaSet = new Set(metaSlugs);
  const sectSet = new Set(sectionSlugs);
  const onlyInMeta = metaSlugs.filter((s) => !sectSet.has(s));
  const onlyInSection = sectionSlugs.filter((s) => !metaSet.has(s));
  if (onlyInMeta.length === 0 && onlyInSection.length === 0) return undefined;
  const parts: string[] = [];
  if (onlyInMeta.length) parts.push(`only in metadata.json: ${onlyInMeta.join(', ')}`);
  if (onlyInSection.length) parts.push(`only in Companion skills section: ${onlyInSection.join(', ')}`);
  return `recommended_skills drift: ${parts.join('; ')}`;
}

export async function checkLinkResolution(
  body: string,
  pathExists: (relative: string) => Promise<boolean>,
): Promise<string[]> {
  const candidates = new Set<string>();
  const collect = (regex: RegExp): void => {
    let m: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((m = regex.exec(body)) !== null) {
      const href = m[2]?.split('#')[0]?.split('?')[0] ?? '';
      if (href && !ABSOLUTE_URL.test(href)) candidates.add(href);
    }
  };
  collect(IMAGE_LINK);
  collect(MARKDOWN_LINK);

  const missing: string[] = [];
  for (const href of candidates) {
    if (!(await pathExists(href))) missing.push(href);
  }
  return missing;
}
