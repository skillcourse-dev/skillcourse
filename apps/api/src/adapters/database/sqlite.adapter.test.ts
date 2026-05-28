import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { SqliteAdapter } from './sqlite.adapter.js';

let tmpDir: string;
let dbFile: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'skillcourse-api-sqlite-'));
  dbFile = join(tmpDir, 'test.db');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('SqliteAdapter', () => {
  it('creates a database file via static factory', async () => {
    const adapter = await SqliteAdapter.create({ databaseFile: dbFile });
    expect(adapter.client).toBeDefined();
    await adapter.close();
  });

  it('migrate() is a no-op in Plan 3 (no tables)', async () => {
    const adapter = await SqliteAdapter.create({ databaseFile: dbFile });
    await expect(adapter.migrate()).resolves.toBeUndefined();
    await adapter.close();
  });

  it('connection is alive (simple SELECT works)', async () => {
    const adapter = await SqliteAdapter.create({ databaseFile: dbFile });
    const result = adapter.client.all<{ name: string }>(sql`SELECT 'ok' as name`);
    expect(result[0]?.name).toBe('ok');
    await adapter.close();
  });
});
