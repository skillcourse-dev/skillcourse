import { Module, type OnApplicationShutdown, Inject, Injectable } from '@nestjs/common';
import { DATABASE_ADAPTER, type DatabaseAdapter } from './database.adapter.js';
import { SqliteAdapter } from './sqlite.adapter.js';

@Injectable()
class DatabaseShutdownHook implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_ADAPTER) private readonly db: DatabaseAdapter) {}
  async onApplicationShutdown(): Promise<void> {
    await this.db.close();
  }
}

@Module({
  providers: [
    {
      provide: DATABASE_ADAPTER,
      useFactory: async (): Promise<DatabaseAdapter> => {
        const driver = process.env.DATABASE_DRIVER ?? 'sqlite';
        if (driver !== 'sqlite') {
          throw new Error(
            `unsupported DATABASE_DRIVER: ${driver} (only 'sqlite' is implemented in Plan 3)`,
          );
        }
        const file = process.env.DATABASE_FILE ?? './data/skillcourse.db';
        const adapter = await SqliteAdapter.create({ databaseFile: file });
        await adapter.migrate();
        return adapter;
      },
    },
    DatabaseShutdownHook,
  ],
  exports: [DATABASE_ADAPTER],
})
export class DatabaseModule {}
