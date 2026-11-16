import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../database/entities';
import { ExerciseCatalogSeeder } from './exercise-catalog.seeder';
import { ExercisesRepository } from './exercises.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],
  providers: [ExercisesRepository, ExerciseCatalogSeeder],
  exports: [ExercisesRepository, ExerciseCatalogSeeder],
})
export class ExercisesModule {}
