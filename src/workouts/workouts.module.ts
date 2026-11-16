import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises/exercises.module';
import { IdempotencyStore } from './idempotency.store';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsRepository } from './workouts.repository';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [ExercisesModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutsRepository, IdempotencyStore],
})
export class WorkoutsModule {}
