import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkoutEntry, WorkoutSet } from '../database/entities';
import { PlannedEntry } from './insert-plan';

const SET_INSERT_CHUNK = 1000;

@Injectable()
export class WorkoutsRepository {
  async insertEntries(manager: EntityManager, entries: PlannedEntry[]): Promise<void> {
    await manager.insert(
      WorkoutEntry,
      entries.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        exerciseId: entry.exerciseId,
        performedAt: entry.performedAt,
        localDate: entry.localDate,
        utcOffsetMinutes: entry.utcOffsetMinutes,
      })),
    );
  }

  async insertSets(manager: EntityManager, entries: PlannedEntry[]): Promise<void> {
    const rows = entries.flatMap((entry) =>
      entry.sets.map((set) => ({
        id: set.id,
        entryId: entry.id,
        setIndex: set.setIndex,
        userId: entry.userId,
        exerciseId: entry.exerciseId,
        localDate: entry.localDate,
        performedAt: entry.performedAt,
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
        weightKg: set.weightKg,
      })),
    );
    for (let start = 0; start < rows.length; start += SET_INSERT_CHUNK) {
      await manager.insert(WorkoutSet, rows.slice(start, start + SET_INSERT_CHUNK));
    }
  }
}
