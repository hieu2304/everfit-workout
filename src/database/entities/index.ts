import { Exercise } from './exercise.entity';
import { IdempotencyKey } from './idempotency-key.entity';
import { WorkoutEntry } from './workout-entry.entity';
import { WorkoutSet } from './workout-set.entity';

export { Exercise, IdempotencyKey, WorkoutEntry, WorkoutSet };

export const ENTITIES = [Exercise, WorkoutEntry, WorkoutSet, IdempotencyKey];
