import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { WorkoutsRepository } from '../src/workouts/workouts.repository';
import { createTestApp, resetDatabase } from './helpers/test-app';

const count = async (db: DataSource, table: string) =>
  (await db.query(`SELECT count(*)::int AS n FROM ${table}`))[0].n as number;

describe('POST /users/:userId/workouts', () => {
  let app: NestExpressApplication;
  let db: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource);
  });

  beforeEach(async () => resetDatabase(app));
  afterAll(async () => app.close());

  it('logs multiple exercises and returns normalized kg', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .send({
        entries: [
          {
            exerciseName: 'bench  press',
            date: '2026-11-16T23:00:00+07:00',
            sets: [{ reps: 5, weight: 225, unit: 'lb' }],
          },
          {
            exerciseName: 'Back Squat',
            date: '2026-11-16',
            sets: [
              { reps: 3, weight: 140, unit: 'kg' },
              { reps: 3, weight: 145, unit: 'kg' },
            ],
          },
        ],
      })
      .expect(201);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      exerciseName: 'Bench Press',
      performedAt: '2026-11-16T16:00:00.000Z',
      localDate: '2026-11-16',
      utcOffsetMinutes: 420,
      sets: [{ reps: 5, weight: 225, unit: 'lb', weightKg: 102.06 }],
    });
    expect(res.body.data[1].sets.map((s: { weightKg: number }) => s.weightKg)).toEqual([140, 145]);
    const [stored] = await db.query(
      `SELECT weight_kg::text AS kg FROM workout_sets WHERE unit = 'lb'`,
    );
    expect(stored.kg).toBe('102.05828325');
  });

  it('rejects the whole batch when one entry is invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .send({
        entries: [
          {
            exerciseName: 'Deadlift',
            date: '2026-11-16',
            sets: [{ reps: 5, weight: 180, unit: 'kg' }],
          },
          {
            exerciseName: 'Deadlift',
            date: '2026-11-16',
            sets: [{ reps: 5, weight: -1, unit: 'kg' }],
          },
        ],
      })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details).toContainEqual({
      path: 'entries[1].sets[0].weight',
      message: 'weight must not be less than 0',
    });
    expect(await count(db, 'workout_entries')).toBe(0);
  });

  it('rolls back entries when the sets insert fails', async () => {
    const spy = jest
      .spyOn(app.get(WorkoutsRepository), 'insertSets')
      .mockRejectedValueOnce(new Error('boom'));
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .send({
        entries: [
          {
            exerciseName: 'Deadlift',
            date: '2026-11-16',
            sets: [{ reps: 5, weight: 180, unit: 'kg' }],
          },
        ],
      })
      .expect(500);
    spy.mockRestore();
    expect(res.body.error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    });
    expect(await count(db, 'workout_entries')).toBe(0);
  });

  it('accepts the maximum batch (100 entries x 50 sets)', async () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      exerciseName: `Exercise ${i % 7}`,
      date: '2026-11-16T10:00:00Z',
      sets: Array.from({ length: 50 }, () => ({ reps: 5, weight: 60.5, unit: 'kg' })),
    }));
    await request(app.getHttpServer()).post('/users/u1/workouts').send({ entries }).expect(201);
    expect(await count(db, 'workout_sets')).toBe(5000);
  });

  it('handles 20 concurrent logs of the same new exercise', async () => {
    const body = {
      entries: [
        {
          exerciseName: 'Sled Push',
          date: '2026-11-16T10:00:00Z',
          sets: [{ reps: 10, weight: 80, unit: 'kg' }],
        },
      ],
    };
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app.getHttpServer()).post('/users/u1/workouts').send(body),
      ),
    );
    expect(results.map((r) => r.status)).toEqual(Array(20).fill(201));
    expect(await count(db, 'workout_entries')).toBe(20);
    const [{ n }] = await db.query(
      `SELECT count(*)::int AS n FROM exercises WHERE normalized_name = 'sled push'`,
    );
    expect(n).toBe(1);
  });

  it('rejects malformed JSON with BAD_REQUEST', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .set('Content-Type', 'application/json')
      .send('{"entries": [')
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects an invalid userId', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/bad%20id!/workouts')
      .send({
        entries: [
          {
            exerciseName: 'Deadlift',
            date: '2026-11-16',
            sets: [{ reps: 5, weight: 180, unit: 'kg' }],
          },
        ],
      })
      .expect(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain('userId');
  });
});
