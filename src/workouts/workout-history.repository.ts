import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkoutEntry, WorkoutSet } from '../database/entities';
import { HistoryCursor } from './history-cursor';

export interface HistoryEntryRow {
  id: string;
  exercise_name: string;
  muscle_groups: string[];
  local_date: string;
  performed_at: string;
  utc_offset_minutes: number | null;
}

export type HistorySetRow = Pick<WorkoutSet, 'entryId' | 'reps' | 'weight' | 'unit' | 'weightKg'>;

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
  constructor(
    @InjectRepository(WorkoutEntry) private readonly entries: Repository<WorkoutEntry>,
    @InjectRepository(WorkoutSet) private readonly sets: Repository<WorkoutSet>,
  ) {}

  findEntries(filter: HistoryFilter): Promise<HistoryEntryRow[]> {
    const query = this.entries
      .createQueryBuilder('e')
      .innerJoin('e.exercise', 'x')
      .select('e.id', 'id')
      .addSelect('x.name', 'exercise_name')
      .addSelect('x.muscleGroups', 'muscle_groups')
      .addSelect('e.localDate', 'local_date')
      .addSelect(
        `to_char(e.performed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
        'performed_at',
      )
      .addSelect('e.utcOffsetMinutes', 'utc_offset_minutes')
      .where('e.userId = :userId', { userId: filter.userId });
    if (filter.exerciseIds?.length === 1) {
      query.andWhere('e.exerciseId = :exerciseId', { exerciseId: filter.exerciseIds[0] });
    } else if (filter.exerciseIds !== undefined && filter.exerciseIds.length > 1) {
      query.andWhere('e.exerciseId IN (:...exerciseIds)', { exerciseIds: filter.exerciseIds });
    }
    if (filter.from !== undefined) query.andWhere('e.localDate >= :from', { from: filter.from });
    if (filter.to !== undefined) query.andWhere('e.localDate <= :to', { to: filter.to });
    if (filter.cursor !== undefined) {
      query.andWhere(
        '(e.localDate, e.performedAt, e.id) < (CAST(:cursorDate AS date), CAST(:cursorAt AS timestamptz), CAST(:cursorId AS uuid))',
        {
          cursorDate: filter.cursor.localDate,
          cursorAt: filter.cursor.performedAt,
          cursorId: filter.cursor.id,
        },
      );
    }
    return query
      .orderBy('e.localDate', 'DESC')
      .addOrderBy('e.performedAt', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .limit(filter.limit + 1)
      .getRawMany<HistoryEntryRow>();
  }

  findSets(entryIds: string[]): Promise<HistorySetRow[]> {
    if (entryIds.length === 0) return Promise.resolve([]);
    return this.sets.find({
      select: { entryId: true, reps: true, weight: true, unit: true, weightKg: true },
      where: { entryId: In(entryIds) },
      order: { entryId: 'ASC', setIndex: 'ASC' },
    });
  }
}
