import { DateTime } from 'luxon';

export interface ParsedWorkoutDate {
  performedAt: Date;
  localDate: string;
  utcOffsetMinutes: number | null;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

export const isCalendarDate = (value: string): boolean =>
  DATE_ONLY.test(value) && DateTime.fromISO(value, { zone: 'utc' }).isValid;

export const parseWorkoutDate = (input: string): ParsedWorkoutDate | null => {
  if (isCalendarDate(input)) {
    const date = DateTime.fromISO(input, { zone: 'utc' });
    return { performedAt: date.toJSDate(), localDate: input, utcOffsetMinutes: null };
  }
  if (!DATETIME_WITH_OFFSET.test(input)) return null;
  const date = DateTime.fromISO(input, { setZone: true });
  const localDate = date.toISODate();
  if (!date.isValid || localDate === null) return null;
  return { performedAt: date.toJSDate(), localDate, utcOffsetMinutes: date.offset };
};

export const isAcceptableWorkoutDate = (input: string, now: Date): boolean => {
  const parsed = parseWorkoutDate(input);
  return parsed !== null && parsed.performedAt.getTime() <= now.getTime() + MAX_FUTURE_MS;
};
