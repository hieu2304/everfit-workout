import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Exercise } from '../database/entities';
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
  constructor(@InjectRepository(Exercise) private readonly exercises: Repository<Exercise>) {}

  async ensureExist(names: string[]): Promise<Map<string, ExerciseRef>> {
    const displayByKey = new Map<string, string>();
    for (const name of names) {
      const key = normalizeExerciseName(name);
      if (!displayByKey.has(key)) displayByKey.set(key, cleanExerciseName(name));
    }
    const keys = [...displayByKey.keys()].sort();
    await this.exercises
      .createQueryBuilder()
      .insert()
      .into(Exercise)
      .values(
        keys.map((key) => ({ id: uuidv7(), name: displayByKey.get(key), normalizedName: key })),
      )
      .orIgnore()
      .execute();
    const rows = await this.exercises.find({
      select: { id: true, name: true, normalizedName: true },
      where: { normalizedName: In(keys) },
    });
    return new Map(rows.map((row) => [row.normalizedName, { id: row.id, name: row.name }]));
  }

  async findByNormalizedName(normalizedName: string): Promise<ExerciseRef | null> {
    return this.exercises.findOne({
      select: { id: true, name: true },
      where: { normalizedName },
    });
  }

  async findIdsMatching(filter: { namePart?: string; muscleGroup?: string }): Promise<string[]> {
    const query = this.exercises.createQueryBuilder('x').select('x.id', 'id');
    if (filter.namePart !== undefined) {
      query.andWhere('x.normalizedName LIKE :pattern', {
        pattern: `%${escapeLikePattern(normalizeExerciseName(filter.namePart))}%`,
      });
    }
    if (filter.muscleGroup !== undefined) {
      query.andWhere(':muscleGroup = ANY(x.muscleGroups)', {
        muscleGroup: filter.muscleGroup.trim().toLowerCase(),
      });
    }
    const rows = await query.getRawMany<{ id: string }>();
    return rows.map((row) => row.id);
  }

  async upsertCatalog(items: CatalogItem[]): Promise<void> {
    const records = [...new Map(items.map((item) => [normalizeExerciseName(item.name), item]))]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => ({
        id: uuidv7(),
        name: cleanExerciseName(item.name),
        normalizedName: key,
        muscleGroups: item.muscleGroups.map((group) => group.trim().toLowerCase()),
      }));
    await this.exercises
      .createQueryBuilder()
      .insert()
      .into(Exercise)
      .values(records)
      .orUpdate(['name', 'muscle_groups'], ['normalized_name'])
      .execute();
  }
}
