import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DatabaseAdapter } from './database.adapter.js';

export interface SqliteAdapterOpts {
  /** Path to the SQLite file. Default: `./data/skillcourse.db` */
  databaseFile?: string;
}

export class SqliteAdapter implements DatabaseAdapter {
  private readonly sqlite: Database.Database;
  readonly client: BetterSQLite3Database;
  private readonly file: string;

  constructor(opts: SqliteAdapterOpts = {}) {
    this.file = opts.databaseFile ?? './data/skillcourse.db';
    this.sqlite = new Database(this.file);
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');
    this.client = drizzle(this.sqlite);
  }

  static async create(opts: SqliteAdapterOpts = {}): Promise<SqliteAdapter> {
    const file = opts.databaseFile ?? './data/skillcourse.db';
    await mkdir(dirname(file), { recursive: true });
    return new SqliteAdapter({ databaseFile: file });
  }

  async migrate(): Promise<void> {
    // No migrations in Plan 3. Plan 5 wires in:
    //   import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
    //   migrate(this.client, { migrationsFolder: './drizzle' });
    return;
  }

  async close(): Promise<void> {
    this.sqlite.close();
  }
}
