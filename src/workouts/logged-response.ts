import { round2 } from '../common/math';
import { PlannedEntry } from './insert-plan';

export interface LoggedSet {
  reps: number;
  weight: number;
  unit: string;
  weightKg: number;
}

export interface LoggedEntry {
  id: string;
  exerciseName: string;
  performedAt: string;
  localDate: string;
  utcOffsetMinutes: number | null;
  sets: LoggedSet[];
}

export interface LogWorkoutsResponse {
  data: LoggedEntry[];
}

export const toLoggedResponse = (plan: PlannedEntry[]): LogWorkoutsResponse => ({
  data: plan.map((entry) => ({
    id: entry.id,
    exerciseName: entry.exerciseName,
    performedAt: entry.performedAt.toISOString(),
    localDate: entry.localDate,
    utcOffsetMinutes: entry.utcOffsetMinutes,
    sets: entry.sets.map((set) => ({
      reps: set.reps,
      weight: Number(set.weight),
      unit: set.unit,
      weightKg: round2(Number(set.weightKg)),
    })),
  })),
});
