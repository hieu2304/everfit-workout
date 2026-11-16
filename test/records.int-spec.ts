import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp, resetDatabase } from './helpers/test-app';

const set = (reps: number, weight: number, unit = 'kg') => ({ reps, weight, unit });

describe('GET /users/:userId/records', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await http()
      .post('/users/u1/workouts')
      .send({
        entries: [
          { exerciseName: 'Bench Press', date: '2026-10-05', sets: [set(5, 100)] },
          { exerciseName: 'Bench Press', date: '2026-10-20', sets: [set(2, 110)] },
          { exerciseName: 'Bench Press', date: '2026-11-03', sets: [set(5, 105)] },
          { exerciseName: 'Bench Press', date: '2026-11-10', sets: [set(5, 105)] },
          { exerciseName: 'Bench Press', date: '2026-11-12', sets: [set(3, 225, 'lb')] },
          { exerciseName: 'Back Squat', date: '2026-11-12', sets: [set(5, 200)] },
        ],
      })
      .expect(201);
  });

  afterAll(async () => app.close());

  it('returns all-time PRs with the earliest date on ties', async () => {
    const res = await http()
      .get('/users/u1/records')
      .query({ exercise: 'bench press' })
      .expect(200);
    expect(res.body.data).toEqual({
      exercise: 'Bench Press',
      unit: 'kg',
      current: {
        from: null,
        to: null,
        maxWeight: { value: 110, weight: 110, reps: 2, date: '2026-10-20' },
        maxVolume: { value: 525, weight: 105, reps: 5, date: '2026-11-03' },
        bestE1rm: { value: 122.5, weight: 105, reps: 5, date: '2026-11-03' },
      },
    });
  });

  it('compares this month vs last month', async () => {
    const res = await http()
      .get('/users/u1/records')
      .query({
        exercise: 'Bench Press',
        from: '2026-11-01',
        to: '2026-11-30',
        compareFrom: '2026-10-01',
        compareTo: '2026-10-31',
      })
      .expect(200);
    expect(res.body.data.current.maxWeight).toEqual({
      value: 105,
      weight: 105,
      reps: 5,
      date: '2026-11-03',
    });
    expect(res.body.data.previous.maxVolume).toEqual({
      value: 500,
      weight: 100,
      reps: 5,
      date: '2026-10-05',
    });
    expect(res.body.data.delta).toEqual({ maxWeight: -5, maxVolume: 25, bestE1rm: 5.17 });
  });

  it('reports in lb', async () => {
    const res = await http()
      .get('/users/u1/records')
      .query({ exercise: 'Bench Press', unit: 'lb' })
      .expect(200);
    expect(res.body.data.current.maxWeight.value).toBe(242.51);
  });

  it('returns nulls with a message for an empty period', async () => {
    const res = await http()
      .get('/users/u1/records')
      .query({ exercise: 'Bench Press', from: '2030-01-01', to: '2030-01-31' })
      .expect(200);
    expect(res.body.data.current).toMatchObject({
      maxWeight: null,
      maxVolume: null,
      bestE1rm: null,
    });
    expect(res.body.data.message).toBe('No sets found for this exercise in the given period');
  });

  it('returns nulls for a known exercise the user never logged', async () => {
    const res = await http().get('/users/u1/records').query({ exercise: 'Plank' }).expect(200);
    expect(res.body.data.current.maxWeight).toBeNull();
  });

  it('404s for an exercise not in the catalog', async () => {
    const res = await http()
      .get('/users/u1/records')
      .query({ exercise: 'Underwater Basket Weaving' })
      .expect(404);
    expect(res.body.error.code).toBe('EXERCISE_NOT_FOUND');
  });

  it.each([
    [{ exercise: 'Bench Press', compareFrom: '2026-10-01', compareTo: '2026-10-31' }, 'from'],
    [
      { exercise: 'Bench Press', from: '2026-11-01', to: '2026-11-30', compareFrom: '2026-10-01' },
      'compareTo',
    ],
    [{ exercise: 'Bench Press', from: '2026-11-01' }, 'to'],
    [{}, 'exercise'],
  ])('validates parameter combinations %#', async (query, path) => {
    const res = await http().get('/users/u1/records').query(query).expect(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(path);
  });
});
