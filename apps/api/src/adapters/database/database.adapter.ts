import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * Interface every Database adapter must implement.
 * Plan 3 ships SqliteAdapter (default).
 * Plan 8 will add PostgresAdapter; both keep this surface.
 */
export interface DatabaseAdapter {
  readonly client: BetterSQLite3Database;
  /** Apply any pending migrations. No-op in Plan 3 (no tables defined yet). */
  migrate(): Promise<void>;
  /** Close the underlying connection. Called on shutdown. */
  close(): Promise<void>;
}

export const DATABASE_ADAPTER = Symbol('DATABASE_ADAPTER');
