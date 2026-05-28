import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { DatabaseModule } from './adapters/database/database.module.js';
import { RegistryModule } from './adapters/registry/registry.module.js';
import { CoursesModule } from './courses/courses.module.js';

@Module({
  imports: [DatabaseModule, RegistryModule, CoursesModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
