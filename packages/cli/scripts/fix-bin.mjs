#!/usr/bin/env node
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const binPath = resolve(here, '..', 'dist', 'bin.js');

if (!existsSync(binPath)) {
  // bin.js doesn't exist yet (e.g. early scaffold before bin.ts lands).
  // Silently skip so `pnpm build` succeeds on the package's first build.
  console.log('[fix-bin] dist/bin.js does not exist yet; skipping');
  process.exit(0);
}

const existing = readFileSync(binPath, 'utf8');
const SHEBANG = '#!/usr/bin/env node\n';

if (!existing.startsWith('#!')) {
  writeFileSync(binPath, SHEBANG + existing, 'utf8');
}
chmodSync(binPath, 0o755);

console.log('[fix-bin] shebang + exec bit applied to', binPath);
