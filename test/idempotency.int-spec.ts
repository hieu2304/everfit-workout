import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, resetDatabase } from './helpers/test-app';

const body = (weight = 100) => ({
  entries: [
    {
      exerciseName: 'Bench Press',
      date: '2026-11-16T10:00:00Z',
      sets: [{ reps: 5, weight, unit: 'kg' }],
    },
  ],
});

describe('Idempotency-Key', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  const post = (userId = 'u1') => request(app.getHttpServer()).post(`/users/${userId}/workouts`);
  const entryCount = async () =>
    (await db.query(`SELECT count(*)::int AS n FROM workout_entries`))[0].n as number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource);
  });

  beforeEach(async () => resetDatabase(app));
  afterAll(async () => app.close());

  it('replays the original response without writing again', async () => {
    const first = await post().set('Idempotency-Key', 'k1').send(body()).expect(201);
    const second = await post().set('Idempotency-Key', 'k1').send(body()).expect(201);
    expect(second.body).toEqual(first.body);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(first.headers['idempotent-replayed']).toBeUndefined();
    expect(await entryCount()).toBe(1);
  });

  it('writes once under 5 concurrent requests with the same key', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => post().set('Idempotency-Key', 'k2').send(body())),
    );
    expect(results.map((r) => r.status)).toEqual(Array(5).fill(201));
    for (const result of results) expect(result.body).toEqual(results[0].body);
    expect(results.filter((r) => r.headers['idempotent-replayed'] === 'true')).toHaveLength(4);
    expect(await entryCount()).toBe(1);
  });

  it('rejects reuse of a key with a different body', async () => {
    await post().set('Idempotency-Key', 'k3').send(body(100)).expect(201);
    const res = await post().set('Idempotency-Key', 'k3').send(body(105)).expect(422);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await entryCount()).toBe(1);
  });

  it('scopes keys per user', async () => {
    await post('u1').set('Idempotency-Key', 'k4').send(body()).expect(201);
    await post('u2').set('Idempotency-Key', 'k4').send(body()).expect(201);
    expect(await entryCount()).toBe(2);
  });

  it('rejects an over-long key', async () => {
    const res = await post().set('Idempotency-Key', 'x'.repeat(256)).send(body()).expect(400);
    expect(res.body.error.details[0].path).toBe('Idempotency-Key');
  });

  it('without a key, duplicate submits create two entries', async () => {
    await post().send(body()).expect(201);
    await post().send(body()).expect(201);
    expect(await entryCount()).toBe(2);
  });
});
