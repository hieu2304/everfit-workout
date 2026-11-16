import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HistoryCursor } from './history-cursor';

export interface HistoryEntryRow {
  id: string;
  exercise_name: string;
  muscle_groups: string[];
  local_date: string;
  performed_at: string;
  utc_offset_minutes: number | null;
}

export interface HistorySetRow {
  entry_id: string;
  reps: number;
  weight: string;
  unit: string;
  weight_kg: string;
}

export interface HistoryFilter {
  userId: string;
  exerciseIds?: string[];
  from?: string;
  to?: string;
  cursor?: HistoryCursor;
  limit: number;
}

@Injectable()
export class WorkoutHistoryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findEntries(filter: HistoryFilter): Promise<HistoryEntryRow[]> {
    const params: unknown[] = [filter.userId];
    const where = ['e.user_id = $1'];
    const bind = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };
    if (filter.exerciseIds?.length === 1) {
      where.push(`e.exercise_id = ${bind(filter.exerciseIds[0])}::uuid`);
    }
    if (filter.exerciseIds !== undefined && filter.exerciseIds.length > 1) {
      where.push(`e.exercise_id = ANY(${bind(filter.exerciseIds)}::uuid[])`);
    }
    if (filter.from !== undefined) where.push(`e.local_date >= ${bind(filter.from)}::date`);
    if (filter.to !== undefined) where.push(`e.local_date <= ${bind(filter.to)}::date`);
    if (filter.cursor !== undefined) {
      const { localDate, performedAt, id } = filter.cursor;
      where.push(
        `(e.local_date, e.performed_at, e.id) < (${bind(localDate)}::date, ${bind(performedAt)}::timestamptz, ${bind(id)}::uuid)`,
      );
    }
    const limit = bind(filter.limit + 1);
    return this.dataSource.query(
      `SELECT e.id, x.name AS exercise_name, x.muscle_groups, e.local_date,
              to_char(e.performed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS performed_at,
              e.utc_offset_minutes
       FROM workout_entries e
       JOIN exercises x ON x.id = e.exercise_id
       WHERE ${where.join(' AND ')}
       ORDER BY e.local_date DESC, e.performed_at DESC, e.id DESC
       LIMIT ${limit}`,
      params,
    );
  }

  async findSets(entryIds: string[]): Promise<HistorySetRow[]> {
    if (entryIds.length === 0) return [];
    return this.dataSource.query(
      `SELECT entry_id, reps, weight::text AS weight, unit, weight_kg::text AS weight_kg
       FROM workout_sets WHERE entry_id = ANY($1::uuid[])
       ORDER BY entry_id, set_index`,
      [entryIds],
    );
  }
}
