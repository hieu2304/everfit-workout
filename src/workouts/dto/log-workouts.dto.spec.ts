import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { flattenValidationErrors } from '../../common/errors/validation-errors';
import { LogWorkoutsDto } from './log-workouts.dto';

const validEntry = () => ({
  exerciseName: 'Bench Press',
  date: '2026-11-16T07:30:00+07:00',
  sets: [{ reps: 5, weight: 100, unit: 'kg' }],
});

const errorsFor = async (body: unknown) =>
  flattenValidationErrors(
    await validate(plainToInstance(LogWorkoutsDto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

describe('LogWorkoutsDto', () => {
  it('accepts a valid bulk payload', async () => {
    expect(
      await errorsFor({ entries: [validEntry(), { ...validEntry(), date: '2026-11-15' }] }),
    ).toEqual([]);
  });

  it.each([
    ['empty sets', { ...validEntry(), sets: [] }, 'entries[0].sets'],
    [
      'negative weight',
      { ...validEntry(), sets: [{ reps: 5, weight: -1, unit: 'kg' }] },
      'entries[0].sets[0].weight',
    ],
    [
      'zero reps',
      { ...validEntry(), sets: [{ reps: 0, weight: 50, unit: 'kg' }] },
      'entries[0].sets[0].reps',
    ],
    [
      'fractional reps',
      { ...validEntry(), sets: [{ reps: 2.5, weight: 50, unit: 'kg' }] },
      'entries[0].sets[0].reps',
    ],
    [
      '3-decimal weight',
      { ...validEntry(), sets: [{ reps: 5, weight: 50.125, unit: 'kg' }] },
      'entries[0].sets[0].weight',
    ],
    [
      'unsupported unit',
      { ...validEntry(), sets: [{ reps: 5, weight: 50, unit: 'stone' }] },
      'entries[0].sets[0].unit',
    ],
    ['null date', { ...validEntry(), date: null }, 'entries[0].date'],
    ['offset-less datetime', { ...validEntry(), date: '2026-11-16T07:30:00' }, 'entries[0].date'],
    ['blank exercise name', { ...validEntry(), exerciseName: '   ' }, 'entries[0].exerciseName'],
    ['unknown field', { ...validEntry(), notes: 'x' }, 'entries[0].notes'],
  ])('rejects %s', async (_label, entry, path) => {
    const details = await errorsFor({ entries: [entry] });
    expect(details.map((d) => d.path)).toContain(path);
  });

  it('rejects empty and oversized batches', async () => {
    expect((await errorsFor({ entries: [] }))[0].path).toBe('entries');
    expect((await errorsFor({ entries: Array.from({ length: 101 }, validEntry) }))[0].path).toBe(
      'entries',
    );
  });
});
