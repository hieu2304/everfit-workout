import { Injectable } from '@nestjs/common';
import { validationFailed } from '../common/errors/app.exception';
import { ExercisesRepository } from '../exercises/exercises.repository';
import { UnitRegistry } from '../units/unit-registry';
import { HistoryQueryDto } from './dto/history-query.dto';
import { decodeCursor, encodeCursor } from './history-cursor';
import {
  HistoryEntryRow,
  HistorySetRow,
  WorkoutHistoryRepository,
} from './workout-history.repository';

export interface HistorySet {
  reps: number;
  weight: number;
  unit: string;
  originalWeight: number;
  originalUnit: string;
}

export interface HistoryEntry {
  id: string;
  exerciseName: string;
  muscleGroups: string[];
  performedAt: string;
  localDate: string;
  utcOffsetMinutes: number | null;
  sets: HistorySet[];
}

export interface HistoryResponse {
  data: HistoryEntry[];
  meta: { limit: number; nextCursor: string | null; message?: string };
}

const EMPTY_MESSAGE = 'No workouts found for the given filters';

@Injectable()
export class WorkoutHistoryService {
  constructor(
    private readonly exercises: ExercisesRepository,
    private readonly history: WorkoutHistoryRepository,
    private readonly units: UnitRegistry,
  ) {}

  async list(userId: string, query: HistoryQueryDto): Promise<HistoryResponse> {
    if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
      throw validationFailed([{ path: 'from', message: 'from must be on or before to' }]);
    }
    const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
    const exerciseIds = await this.resolveExerciseIds(query);
    if (exerciseIds !== undefined && exerciseIds.length === 0)
      return this.toResponse([], [], query);
    const rows = await this.history.findEntries({
      userId,
      exerciseIds,
      from: query.from,
      to: query.to,
      cursor,
      limit: query.limit,
    });
    const page = rows.slice(0, query.limit);
    const sets = await this.history.findSets(page.map((row) => row.id));
    return this.toResponse(page, sets, query, rows.length > query.limit);
  }

  private async resolveExerciseIds(query: HistoryQueryDto): Promise<string[] | undefined> {
    if (query.exercise === undefined && query.muscleGroup === undefined) return undefined;
    return this.exercises.findIdsMatching({
      namePart: query.exercise,
      muscleGroup: query.muscleGroup,
    });
  }

  private toResponse(
    page: HistoryEntryRow[],
    sets: HistorySetRow[],
    query: HistoryQueryDto,
    hasMore = false,
  ): HistoryResponse {
    const setsByEntry = new Map<string, HistorySetRow[]>();
    for (const set of sets) {
      setsByEntry.set(set.entryId, [...(setsByEntry.get(set.entryId) ?? []), set]);
    }
    const data = page.map((row) => ({
      id: row.id,
      exerciseName: row.exercise_name,
      muscleGroups: row.muscle_groups,
      performedAt: row.performed_at,
      localDate: row.local_date,
      utcOffsetMinutes: row.utc_offset_minutes,
      sets: (setsByEntry.get(row.id) ?? []).map((set) => ({
        reps: set.reps,
        weight:
          set.unit === query.unit
            ? Number(set.weight)
            : this.units.fromKg(Number(set.weightKg), query.unit),
        unit: query.unit,
        originalWeight: Number(set.weight),
        originalUnit: set.unit,
      })),
    }));
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeCursor({ localDate: last.local_date, performedAt: last.performed_at, id: last.id })
        : null;
    return {
      data,
      meta: {
        limit: query.limit,
        nextCursor,
        ...(data.length === 0 ? { message: EMPTY_MESSAGE } : {}),
      },
    };
  }
}
