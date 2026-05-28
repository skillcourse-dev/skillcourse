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
} from '../adapters/registry/registry.adapter.js';
import type { ChapterWithMinutes, Course } from '@skillcourse-dev/shared';

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
    try {
      return await this.registry.load(slug);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get(':slug/chapters/:index')
  async chapter(
    @Param('slug') slug: string,
    @Param('index') indexParam: string,
  ): Promise<ChapterWithMinutes> {
    const index = Number(indexParam);
    if (!Number.isInteger(index) || index < 1) {
      throw new BadRequestException(`chapter index must be a positive integer, got: ${indexParam}`);
    }

    let course: Course;
    try {
      course = await this.registry.load(slug);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }

    const chapter = course.chapters[index - 1];
    if (!chapter) {
      throw new NotFoundException(`chapter ${index} not found in course ${slug}`);
    }
    return chapter;
  }
}
