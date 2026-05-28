import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import request from 'supertest';
import { AppModule } from '../app.module.js';
import { COURSE_REGISTRY_ADAPTER } from '../adapters/registry/registry.adapter.js';
import { FilesystemRegistry } from '../adapters/registry/filesystem.adapter.js';
import { DATABASE_ADAPTER } from '../adapters/database/database.adapter.js';
import { SqliteAdapter } from '../adapters/database/sqlite.adapter.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCoursesDir = resolve(
  here,
  '..',
  'adapters',
  'registry',
  '__fixtures__',
  'sample-registry',
  'courses',
);

describe('full app boot', () => {
  let app: INestApplication;
  let dbDir: string;
  let dbAdapter: SqliteAdapter;

  beforeAll(async () => {
    dbDir = await mkdtemp(join(tmpdir(), 'skillcourse-api-e2e-'));
    dbAdapter = await SqliteAdapter.create({ databaseFile: join(dbDir, 'test.db') });

    // Override providers instead of mutating process.env. Cleaner, test-isolated,
    // and verifies that the production module structure works with adapter
    // substitution (which is the whole point of the adapter interfaces).
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(COURSE_REGISTRY_ADAPTER)
      .useValue(new FilesystemRegistry({ coursesDir: fixtureCoursesDir }))
      .overrideProvider(DATABASE_ADAPTER)
      .useValue(dbAdapter)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await dbAdapter.close();
    await rm(dbDir, { recursive: true, force: true });
  });

  it('serves /health, /courses, /courses/alpha, /courses/alpha/chapters/1 in one boot', async () => {
    const health = await request(app.getHttpServer()).get('/health');
    expect(health.status).toBe(200);

    const list = await request(app.getHttpServer()).get('/courses');
    expect(list.status).toBe(200);
    expect(list.body.courses.map((c: { slug: string }) => c.slug).sort()).toEqual(['alpha', 'beta']);

    const detail = await request(app.getHttpServer()).get('/courses/alpha');
    expect(detail.status).toBe(200);
    expect(detail.body.chapters).toHaveLength(2);

    const chapter = await request(app.getHttpServer()).get('/courses/alpha/chapters/1');
    expect(chapter.status).toBe(200);
    expect(chapter.body.title).toBe('Alpha intro');
  });
});
