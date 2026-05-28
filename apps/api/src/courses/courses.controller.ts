import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  COURSE_REGISTRY_ADAPTER,
  type CourseRegistryAdapter,
  type CourseSummary,
  CourseNotFoundError,
  InvalidSlugError,
} from '../adapters/registry/registry.adapter.js';
import type { ChapterWithMinutes, Course } from '@skillcourse-dev/shared';

/** Chapter index: positive integer in decimal notation. Excludes "1e2", "+1", "01", "1.0" etc. */
const POSITIVE_INTEGER = /^[1-9]\d*$/;

@Controller('courses')
export class CoursesController {
  constructor(
    @Inject(COURSE_REGISTRY_ADAPTER) private readonly registry: CourseRegistryAdapter,
  ) {}

  @Get()
  async list(): Promise<{ courses: CourseSummary[] }> {
    const courses = await this.registry.list();
    return { courses };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<Course> {
    return this.loadOrThrow(slug);
  }

  @Get(':slug/chapters/:index')
  async chapter(
    @Param('slug') slug: string,
    @Param('index') indexParam: string,
  ): Promise<ChapterWithMinutes> {
    if (!POSITIVE_INTEGER.test(indexParam)) {
      throw new BadRequestException(`chapter index must be a positive integer, got: ${indexParam}`);
    }
    const index = parseInt(indexParam, 10);

    const course = await this.loadOrThrow(slug);
    const chapter = course.chapters[index - 1];
    if (!chapter) {
      throw new NotFoundException(`chapter ${index} not found in course ${slug}`);
    }
    return chapter;
  }

  /** Load by slug, translating registry-level errors into HTTP exceptions. */
  private async loadOrThrow(slug: string): Promise<Course> {
    try {
      return await this.registry.load(slug);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof InvalidSlugError) {
        // Treat invalid slugs as 404 from the HTTP client's perspective: the
        // route exists, but no such resource. Returning 400 here would leak
        // info about our internal slug validation rules.
        throw new NotFoundException(`course not found: ${slug}`);
      }
      throw err;
    }
  }
}
