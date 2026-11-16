import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp, resetDatabase } from './helpers/test-app';

describe('GET /users/:userId/workouts', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());
  const log = (entries: unknown[]) =>
    http().post('/users/u1/workouts').send({ entries }).expect(201);

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => resetDatabase(app));
  afterAll(async () => app.close());

  it('walks every page exactly once even with identical timestamps', async () => {
    await log(
      Array.from({ length: 25 }, () => ({
        exerciseName: 'Bench Press',
        date: '2026-11-16T10:00:00Z',
        sets: [{ reps: 5, weight: 100, unit: 'kg' }],
      })),
    );
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res: request.Response = await http()
        .get('/users/u1/workouts')
        .query({ limit: 10, ...(cursor ? { cursor } : {}) })
        .expect(200);
      seen.push(...res.body.data.map((e: { id: string }) => e.id));
      cursor = res.body.meta.nextCursor;
      pages += 1;
    } while (cursor !== null);
    expect(pages).toBe(3);
    expect(seen).toHaveLength(25);
    expect(new Set(seen).size).toBe(25);
  });

  it('orders by local date, newest first', async () => {
    await log([
      {
        exerciseName: 'Deadlift',
        date: '2026-11-10',
        sets: [{ reps: 5, weight: 180, unit: 'kg' }],
      },
      {
        exerciseName: 'Deadlift',
        date: '2026-11-16T23:30:00+07:00',
        sets: [{ reps: 5, weight: 185, unit: 'kg' }],
      },
      {
        exerciseName: 'Deadlift',
        date: '2026-11-12',
        sets: [{ reps: 5, weight: 182.5, unit: 'kg' }],
      },
    ]);
    const res = await http().get('/users/u1/workouts').expect(200);
    expect(res.body.data.map((e: { localDate: string }) => e.localDate)).toEqual([
      '2026-11-16',
      '2026-11-12',
      '2026-11-10',
    ]);
  });

  it('filters by partial name, muscle group and inclusive local date range', async () => {
    await log([
      {
        exerciseName: 'Bench Press',
        date: '2026-11-01',
        sets: [{ reps: 5, weight: 100, unit: 'kg' }],
      },
      {
        exerciseName: 'Incline Bench Press',
        date: '2026-11-16T23:00:00+07:00',
        sets: [{ reps: 8, weight: 70, unit: 'kg' }],
      },
      {
        exerciseName: 'Back Squat',
        date: '2026-11-16',
        sets: [{ reps: 5, weight: 140, unit: 'kg' }],
      },
    ]);
    const byName = await http().get('/users/u1/workouts').query({ exercise: 'bench' }).expect(200);
    expect(byName.body.data).toHaveLength(2);
    const byGroup = await http()
      .get('/users/u1/workouts')
      .query({ muscleGroup: 'legs' })
      .expect(200);
    expect(byGroup.body.data.map((e: { exerciseName: string }) => e.exerciseName)).toEqual([
      'Back Squat',
    ]);
    const byRange = await http()
      .get('/users/u1/workouts')
      .query({ from: '2026-11-16', to: '2026-11-16' })
      .expect(200);
    expect(byRange.body.data).toHaveLength(2);
  });

  it('converts to the requested unit and keeps originals', async () => {
    await log([
      {
        exerciseName: 'Bench Press',
        date: '2026-11-16',
        sets: [
          { reps: 5, weight: 100, unit: 'kg' },
          { reps: 5, weight: 225, unit: 'lb' },
        ],
      },
    ]);
    const res = await http().get('/users/u1/workouts').query({ unit: 'lb' }).expect(200);
    expect(res.body.data[0].sets).toEqual([
      { reps: 5, weight: 220.46, unit: 'lb', originalWeight: 100, originalUnit: 'kg' },
      { reps: 5, weight: 225, unit: 'lb', originalWeight: 225, originalUnit: 'lb' },
    ]);
  });

  it('returns an empty page with a message, not an error', async () => {
    const res = await http()
      .get('/users/u1/workouts')
      .query({ from: '2030-01-01', to: '2030-01-31' })
      .expect(200);
    expect(res.body).toEqual({
      data: [],
      meta: { limit: 20, nextCursor: null, message: 'No workouts found for the given filters' },
    });
    const unknown = await http().get('/users/u1/workouts').query({ exercise: 'zzz' }).expect(200);
    expect(unknown.body.data).toEqual([]);
  });

  it.each([
    [{ cursor: 'garbage' }, 'INVALID_CURSOR'],
    [{ unit: 'stone' }, 'VALIDATION_FAILED'],
    [{ limit: 0 }, 'VALIDATION_FAILED'],
    [{ from: '2026-02-30' }, 'VALIDATION_FAILED'],
    [{ from: '2026-11-17', to: '2026-11-16' }, 'VALIDATION_FAILED'],
  ])('rejects %p', async (query, code) => {
    const res = await http().get('/users/u1/workouts').query(query).expect(400);
    expect(res.body.error.code).toBe(code);
  });
});
