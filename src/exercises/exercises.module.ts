import { Module } from '@nestjs/common';
import { ExerciseCatalogSeeder } from './exercise-catalog.seeder';
import { ExercisesRepository } from './exercises.repository';

@Module({
  providers: [ExercisesRepository, ExerciseCatalogSeeder],
  exports: [ExercisesRepository, ExerciseCatalogSeeder],
})
export class ExercisesModule {}
