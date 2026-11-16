import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { createTestApp, resetDatabase } from './helpers/test-app';

describe('schema', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let entryId: string;
  let exerciseId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await resetDatabase(app);
    exerciseId = uuidv7();
    entryId = uuidv7();
    await db.query(
      `INSERT INTO exercises (id, name, normalized_name) VALUES ($1, 'Bench Press', 'bench press')`,
      [exerciseId],
    );
    await db.query(
      `INSERT INTO workout_entries (id, user_id, exercise_id, performed_at, local_date)
       VALUES ($1, 'u1', $2, now(), '2026-11-16')`,
      [entryId, exerciseId],
    );
  });

  afterAll(async () => app.close());

  const insertSet = (setIndex: number, reps: number, weightKg: string) =>
    db.query(
      `INSERT INTO workout_sets (id, entry_id, set_index, user_id, exercise_id, local_date, performed_at, reps, weight, unit, weight_kg)
       VALUES ($1, $2, $3, 'u1', $4, '2026-11-16', now(), $5, $6, 'kg', $6)
       RETURNING volume_kg::text AS volume_kg, round(e1rm_kg, 4)::text AS e1rm_kg`,
      [uuidv7(), entryId, setIndex, exerciseId, reps, weightKg],
    );

  it('computes volume and Epley e1RM without integer division', async () => {
    expect(await insertSet(0, 5, '100')).toEqual([{ volume_kg: '500', e1rm_kg: '116.6667' }]);
    expect(await insertSet(1, 1, '100')).toEqual([{ volume_kg: '100', e1rm_kg: '103.3333' }]);
  });

  it('converts lb exactly with numeric arithmetic', async () => {
    const [row] = await db.query(`SELECT ('225'::numeric * '0.45359237'::numeric)::text AS kg`);
    expect(row.kg).toBe('102.05828325');
  });

  it('returns date columns as plain YYYY-MM-DD strings', async () => {
    const [row] = await db.query(`SELECT local_date FROM workout_entries WHERE id = $1`, [entryId]);
    expect(row.local_date).toBe('2026-11-16');
  });

  it('rejects zero reps and negative weight', async () => {
    await expect(insertSet(0, 0, '100')).rejects.toThrow(/check constraint/);
    await expect(insertSet(0, 5, '-1')).rejects.toThrow(/check constraint/);
  });
});
