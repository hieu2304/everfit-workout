import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlannedEntry } from './insert-plan';

@Injectable()
export class WorkoutsRepository {
  async insertEntries(manager: EntityManager, entries: PlannedEntry[]): Promise<void> {
    await manager.query(
      `INSERT INTO workout_entries (id, user_id, exercise_id, performed_at, local_date, utc_offset_minutes)
       SELECT * FROM unnest($1::uuid[], $2::text[], $3::uuid[], $4::timestamptz[], $5::date[], $6::smallint[])`,
      [
        entries.map((e) => e.id),
        entries.map((e) => e.userId),
        entries.map((e) => e.exerciseId),
        entries.map((e) => e.performedAt.toISOString()),
        entries.map((e) => e.localDate),
        entries.map((e) => e.utcOffsetMinutes),
      ],
    );
  }

  async insertSets(manager: EntityManager, entries: PlannedEntry[]): Promise<Map<string, string>> {
    const rows = entries.flatMap((entry) => entry.sets.map((set) => ({ entry, set })));
    const inserted: { id: string; weight_kg: string }[] = await manager.query(
      `INSERT INTO workout_sets (id, entry_id, set_index, user_id, exercise_id, local_date, performed_at, reps, weight, unit, weight_kg)
       SELECT s.id, s.entry_id, s.set_index, s.user_id, s.exercise_id, s.local_date, s.performed_at,
              s.reps, s.weight, s.unit, s.weight * s.factor
       FROM unnest($1::uuid[], $2::uuid[], $3::smallint[], $4::text[], $5::uuid[], $6::date[],
                   $7::timestamptz[], $8::integer[], $9::numeric[], $10::text[], $11::numeric[])
         AS s(id, entry_id, set_index, user_id, exercise_id, local_date, performed_at, reps, weight, unit, factor)
       RETURNING id, weight_kg::text AS weight_kg`,
      [
        rows.map(({ set }) => set.id),
        rows.map(({ entry }) => entry.id),
        rows.map(({ set }) => set.setIndex),
        rows.map(({ entry }) => entry.userId),
        rows.map(({ entry }) => entry.exerciseId),
        rows.map(({ entry }) => entry.localDate),
        rows.map(({ entry }) => entry.performedAt.toISOString()),
        rows.map(({ set }) => set.reps),
        rows.map(({ set }) => set.weight),
        rows.map(({ set }) => set.unit),
        rows.map(({ set }) => set.factorToKg),
      ],
    );
    return new Map(inserted.map((row) => [row.id, row.weight_kg]));
  }
}
