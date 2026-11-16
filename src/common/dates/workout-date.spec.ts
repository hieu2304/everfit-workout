import { isAcceptableWorkoutDate, isCalendarDate, parseWorkoutDate } from './workout-date';

describe('parseWorkoutDate', () => {
  it('keeps the client local date for late-evening offsets', () => {
    expect(parseWorkoutDate('2026-11-16T23:00:00+07:00')).toEqual({
      performedAt: new Date('2026-11-16T16:00:00.000Z'),
      localDate: '2026-11-16',
      utcOffsetMinutes: 420,
    });
  });

  it('handles negative offsets crossing UTC midnight', () => {
    expect(parseWorkoutDate('2026-11-16T21:30:00-05:00')).toEqual({
      performedAt: new Date('2026-11-17T02:30:00.000Z'),
      localDate: '2026-11-16',
      utcOffsetMinutes: -300,
    });
  });

  it('accepts Z', () => {
    expect(parseWorkoutDate('2026-11-16T08:00:00.123Z')?.utcOffsetMinutes).toBe(0);
  });

  it('accepts date-only as a calendar date without offset', () => {
    expect(parseWorkoutDate('2026-11-16')).toEqual({
      performedAt: new Date('2026-11-16T00:00:00.000Z'),
      localDate: '2026-11-16',
      utcOffsetMinutes: null,
    });
  });

  it.each([
    '2026-11-16T10:00:00',
    '2026-02-30',
    '2026-02-30T10:00:00Z',
    '16/11/2026',
    '',
    'garbage',
  ])('rejects %p', (input) => {
    expect(parseWorkoutDate(input)).toBeNull();
  });
});

describe('isAcceptableWorkoutDate', () => {
  const now = new Date('2026-11-16T12:00:00Z');

  it('allows up to 24h in the future', () => {
    expect(isAcceptableWorkoutDate('2026-11-17T11:00:00Z', now)).toBe(true);
  });

  it('rejects more than 24h in the future', () => {
    expect(isAcceptableWorkoutDate('2026-11-17T13:00:00Z', now)).toBe(false);
  });
});

describe('isCalendarDate', () => {
  it.each([
    ['2026-02-28', true],
    ['2024-02-29', true],
    ['2026-02-29', false],
    ['2026-2-1', false],
    ['2026-11-16T00:00:00Z', false],
  ])('%p → %p', (input, expected) => {
    expect(isCalendarDate(input)).toBe(expected);
  });
});
