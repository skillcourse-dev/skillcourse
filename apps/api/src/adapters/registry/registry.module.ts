import { Module } from '@nestjs/common';
import { resolve } from 'node:path';
import { COURSE_REGISTRY_ADAPTER, type CourseRegistryAdapter } from './registry.adapter.js';
import { FilesystemRegistry } from './filesystem.adapter.js';

@Module({
  providers: [
    {
      provide: COURSE_REGISTRY_ADAPTER,
      useFactory: (): CourseRegistryAdapter => {
        const driver = process.env.REGISTRY_DRIVER ?? 'filesystem';
        if (driver !== 'filesystem') {
          throw new Error(
            `unsupported REGISTRY_DRIVER: ${driver} (only 'filesystem' is implemented in Plan 3)`,
          );
        }
        const coursesDir = process.env.COURSES_DIR ?? resolve(process.cwd(), 'courses');
        return new FilesystemRegistry({ coursesDir });
      },
    },
  ],
  exports: [COURSE_REGISTRY_ADAPTER],
})
export class RegistryModule {}
