import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import request from 'supertest';
import { CoursesController } from './courses.controller.js';
import { COURSE_REGISTRY_ADAPTER } from '../adapters/registry/registry.adapter.js';
import { FilesystemRegistry } from '../adapters/registry/filesystem.adapter.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRegistry = resolve(
  here,
  '..',
  'adapters',
  'registry',
  '__fixtures__',
  'sample-registry',
  'courses',
);

describe('CoursesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: COURSE_REGISTRY_ADAPTER,
          useValue: new FilesystemRegistry({ coursesDir: fixtureRegistry }),
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses', () => {
    it('returns 200 with alpha + beta summaries', async () => {
      const res = await request(app.getHttpServer()).get('/courses');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('courses');
      expect(res.body.courses).toHaveLength(2);
      expect(res.body.courses[0].slug).toBe('alpha');
      expect(res.body.courses[1].slug).toBe('beta');
    });

    it('does NOT include chapter body content (summary only)', async () => {
      const res = await request(app.getHttpServer()).get('/courses');
      const first = res.body.courses[0];
      expect(first).not.toHaveProperty('chapters');
      expect(first).toHaveProperty('chapterCount');
    });
  });

  describe('GET /courses/:slug', () => {
    it('returns 200 with the full course detail for alpha', async () => {
      const res = await request(app.getHttpServer()).get('/courses/alpha');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('alpha');
      expect(res.body.chapters).toHaveLength(2);
      expect(res.body.chapters[0].title).toBe('Alpha intro');
      expect(res.body.metadata.title.en).toBe('Alpha');
      expect(res.body.companionSkills).toHaveLength(1);
    });

    it('returns 404 with a structured body when slug does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/courses/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toMatch(/does-not-exist/);
    });
  });

  describe('GET /courses/:slug/chapters/:index', () => {
    it('returns chapter 1 of alpha', async () => {
      const res = await request(app.getHttpServer()).get('/courses/alpha/chapters/1');
      expect(res.status).toBe(200);
      expect(res.body.index).toBe(1);
      expect(res.body.title).toBe('Alpha intro');
      expect(res.body.body).toContain('First chapter of alpha');
      expect(res.body.estimatedMinutes).toBeGreaterThanOrEqual(1);
    });

    it('returns 404 when chapter index is out of range', async () => {
      const res = await request(app.getHttpServer()).get('/courses/alpha/chapters/99');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/chapter 99/);
    });

    it('returns 404 when course slug does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/courses/missing/chapters/1');
      expect(res.status).toBe(404);
    });

    it('returns 400 when chapter index is not a positive integer', async () => {
      const res = await request(app.getHttpServer()).get('/courses/alpha/chapters/abc');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/chapter index/i);
    });
  });
});
