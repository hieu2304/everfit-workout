import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { cleanExerciseName, escapeLikePattern, normalizeExerciseName } from './exercise-name';

export interface ExerciseRef {
  id: string;
  name: string;
}

export interface CatalogItem {
  name: string;
  muscleGroups: string[];
}

@Injectable()
export class ExercisesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async ensureExist(names: string[]): Promise<Map<string, ExerciseRef>> {
    const displayByKey = new Map<string, string>();
    for (const name of names) {
      const key = normalizeExerciseName(name);
      if (!displayByKey.has(key)) displayByKey.set(key, cleanExerciseName(name));
    }
    const keys = [...displayByKey.keys()].sort();
    await this.dataSource.query(
      `INSERT INTO exercises (id, name, normalized_name)
       SELECT * FROM unnest($1::uuid[], $2::text[], $3::text[])
       ON CONFLICT (normalized_name) DO NOTHING`,
      [keys.map(() => uuidv7()), keys.map((key) => displayByKey.get(key)), keys],
    );
    const rows: { id: string; name: string; normalized_name: string }[] =
      await this.dataSource.query(
        `SELECT id, name, normalized_name FROM exercises WHERE normalized_name = ANY($1::text[])`,
        [keys],
      );
    return new Map(rows.map((row) => [row.normalized_name, { id: row.id, name: row.name }]));
  }

  async findByNormalizedName(normalizedName: string): Promise<ExerciseRef | null> {
    const rows: ExerciseRef[] = await this.dataSource.query(
      `SELECT id, name FROM exercises WHERE normalized_name = $1`,
      [normalizedName],
    );
    return rows[0] ?? null;
  }

  async findIdsMatching(filter: { namePart?: string; muscleGroup?: string }): Promise<string[]> {
    const namePattern =
      filter.namePart === undefined
        ? null
        : escapeLikePattern(normalizeExerciseName(filter.namePart));
    const muscleGroup =
      filter.muscleGroup === undefined ? null : filter.muscleGroup.trim().toLowerCase();
    const rows: { id: string }[] = await this.dataSource.query(
      `SELECT id FROM exercises
       WHERE ($1::text IS NULL OR normalized_name LIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR $2 = ANY(muscle_groups))`,
      [namePattern, muscleGroup],
    );
    return rows.map((row) => row.id);
  }

  async upsertCatalog(items: CatalogItem[]): Promise<void> {
    const records = [...new Map(items.map((item) => [normalizeExerciseName(item.name), item]))]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => ({
        id: uuidv7(),
        name: cleanExerciseName(item.name),
        normalized_name: key,
        muscle_groups: item.muscleGroups.map((group) => group.trim().toLowerCase()),
      }));
    await this.dataSource.query(
      `INSERT INTO exercises (id, name, normalized_name, muscle_groups)
       SELECT id, name, normalized_name, muscle_groups
       FROM jsonb_to_recordset($1::jsonb)
         AS x(id uuid, name text, normalized_name text, muscle_groups text[])
       ON CONFLICT (normalized_name)
       DO UPDATE SET name = EXCLUDED.name, muscle_groups = EXCLUDED.muscle_groups`,
      [JSON.stringify(records)],
    );
  }
}
