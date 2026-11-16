import { v7 as uuidv7 } from 'uuid';
import { multiplyDecimals } from '../common/decimal';
import { parseWorkoutDate } from '../common/dates/workout-date';
import { normalizeExerciseName } from '../exercises/exercise-name';
import { ExerciseRef } from '../exercises/exercises.repository';
import { UnitRegistry } from '../units/unit-registry';
import { LogWorkoutsDto } from './dto/log-workouts.dto';

export interface PlannedSet {
  id: string;
  setIndex: number;
  reps: number;
  weight: string;
  unit: string;
  weightKg: string;
}

export interface PlannedEntry {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  performedAt: Date;
  localDate: string;
  utcOffsetMinutes: number | null;
  sets: PlannedSet[];
}

export const buildInsertPlan = (
  userId: string,
  dto: LogWorkoutsDto,
  exerciseByKey: Map<string, ExerciseRef>,
  units: UnitRegistry,
): PlannedEntry[] =>
  dto.entries.map((entry) => {
    const when = parseWorkoutDate(entry.date);
    const exercise = exerciseByKey.get(normalizeExerciseName(entry.exerciseName));
    if (when === null || exercise === undefined) {
      throw new Error(
        `Invariant violated: validated entry "${entry.exerciseName}" could not be planned`,
      );
    }
    return {
      id: uuidv7(),
      userId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      performedAt: when.performedAt,
      localDate: when.localDate,
      utcOffsetMinutes: when.utcOffsetMinutes,
      sets: entry.sets.map((set, index) => {
        const weight = String(set.weight);
        return {
          id: uuidv7(),
          setIndex: index,
          reps: set.reps,
          weight,
          unit: set.unit,
          weightKg: multiplyDecimals(weight, units.factorToKg(set.unit)),
        };
      }),
    };
  });
