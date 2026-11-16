import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { CatalogItem, ExercisesRepository } from './exercises.repository';

const catalogSchema = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      muscleGroups: Joi.array().items(Joi.string().trim().lowercase().min(1)).unique().required(),
    }),
  )
  .required();

@Injectable()
export class ExerciseCatalogSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: ConfigService,
    private readonly exercises: ExercisesRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<number> {
    const path = resolve(process.cwd(), this.config.getOrThrow<string>('EXERCISES_CONFIG_PATH'));
    const { value, error } = catalogSchema.validate(JSON.parse(await readFile(path, 'utf8')));
    if (error) throw new Error(`Invalid exercise catalog at ${path}: ${error.message}`);
    const items = value as CatalogItem[];
    await this.exercises.upsertCatalog(items);
    return items.length;
  }
}
