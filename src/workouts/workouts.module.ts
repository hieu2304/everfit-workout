import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutEntry, WorkoutSet } from '../database/entities';
import { ExercisesModule } from '../exercises/exercises.module';
import { IdempotencyStore } from './idempotency.store';
import { WorkoutHistoryController } from './workout-history.controller';
import { WorkoutHistoryRepository } from './workout-history.repository';
import { WorkoutHistoryService } from './workout-history.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsRepository } from './workouts.repository';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [ExercisesModule, TypeOrmModule.forFeature([WorkoutEntry, WorkoutSet])],
  controllers: [WorkoutsController, WorkoutHistoryController],
  providers: [
    WorkoutsService,
    WorkoutsRepository,
    IdempotencyStore,
    WorkoutHistoryService,
    WorkoutHistoryRepository,
  ],
})
export class WorkoutsModule {}
