import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller.js';
import { RegistryModule } from '../adapters/registry/registry.module.js';

@Module({
  imports: [RegistryModule],
  controllers: [CoursesController],
})
export class CoursesModule {}
