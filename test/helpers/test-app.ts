import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { ExerciseCatalogSeeder } from '../../src/exercises/exercise-catalog.seeder';

export const createTestApp = async (): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  configureApp(app);
  await app.init();
  return app;
};

export const resetDatabase = async (app: NestExpressApplication): Promise<void> => {
  await app
    .get(DataSource)
    .query('TRUNCATE workout_sets, workout_entries, idempotency_keys, exercises CASCADE');
  await app.get(ExerciseCatalogSeeder).seed();
};
