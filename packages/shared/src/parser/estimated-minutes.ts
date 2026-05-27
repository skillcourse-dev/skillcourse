const OVERRIDE = /<!--\s*meta:\s*minutes\s*=\s*(\d+)\s*-->/i;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const WORDS_PER_MINUTE = 200;

export function estimateChapterMinutes(body: string): number {
  const override = body.match(OVERRIDE);
  if (override?.[1]) {
    const value = parseInt(override[1], 10);
    if (Number.isFinite(value) && value > 0) return value;
  }
  const text = body.replace(HTML_COMMENT, ' ');
  const words = text.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w));
  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
}
