import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/adapters/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_FILE ?? './data/skillcourse.db',
  },
});
