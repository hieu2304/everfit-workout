import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from '../src/exercises/exercises.repository';
import { createTestApp, resetDatabase } from './helpers/test-app';

describe('exercise catalog', () => {
  let app: NestExpressApplication;
  let repo: ExercisesRepository;
  let db: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    repo = app.get(ExercisesRepository);
    db = app.get(DataSource);
  });

  beforeEach(async () => resetDatabase(app));
  afterAll(async () => app.close());

  it('seeds muscle groups from config', async () => {
    const [row] = await db.query(
      `SELECT muscle_groups FROM exercises WHERE normalized_name = 'deadlift'`,
    );
    expect(row.muscle_groups).toEqual(['back', 'legs', 'glutes']);
  });

  it('updates muscle groups when the catalog changes', async () => {
    await repo.upsertCatalog([{ name: 'Deadlift', muscleGroups: ['back'] }]);
    const [row] = await db.query(
      `SELECT muscle_groups FROM exercises WHERE normalized_name = 'deadlift'`,
    );
    expect(row.muscle_groups).toEqual(['back']);
  });

  it('resolves existing and new names, collapsing case/spacing variants', async () => {
    const result = await repo.ensureExist(['bench press', 'Zercher  Squat', 'zercher squat']);
    expect([...result.keys()].sort()).toEqual(['bench press', 'zercher squat']);
    expect(result.get('zercher squat')?.name).toBe('Zercher Squat');
  });

  it('creates a new exercise exactly once under 20 concurrent calls', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => repo.ensureExist(['Sled Push'])),
    );
    const ids = new Set(results.map((r) => r.get('sled push')?.id));
    expect(ids.size).toBe(1);
    const [{ count }] = await db.query(
      `SELECT count(*)::int AS count FROM exercises WHERE normalized_name = 'sled push'`,
    );
    expect(count).toBe(1);
  });

  it('does not deadlock when concurrent calls list new names in opposite order', async () => {
    const runs = Array.from({ length: 10 }, (_, i) =>
      repo.ensureExist(i % 2 === 0 ? ['Alpha Lift', 'Omega Lift'] : ['Omega Lift', 'Alpha Lift']),
    );
    await expect(Promise.all(runs)).resolves.toHaveLength(10);
  });

  it('finds ids by partial name and muscle group', async () => {
    expect(await repo.findIdsMatching({ namePart: 'BENCH' })).toHaveLength(2);
    expect(await repo.findIdsMatching({ muscleGroup: 'Core' })).toHaveLength(2);
    expect(await repo.findIdsMatching({ namePart: 'squat', muscleGroup: 'core' })).toHaveLength(1);
  });

  it('treats LIKE wildcards in the search literally', async () => {
    expect(await repo.findIdsMatching({ namePart: '%' })).toEqual([]);
  });
});
