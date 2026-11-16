import { cleanExerciseName, escapeLikePattern, normalizeExerciseName } from './exercise-name';

describe('exercise name helpers', () => {
  it('cleans whitespace but keeps case for display', () => {
    expect(cleanExerciseName('  Bench   Press ')).toBe('Bench Press');
  });

  it('normalizes to lowercase single-spaced', () => {
    expect(normalizeExerciseName('  BENCH \t Press ')).toBe('bench press');
  });

  it('escapes LIKE wildcards', () => {
    expect(escapeLikePattern('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
