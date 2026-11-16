import { ValidationOptions, registerDecorator } from 'class-validator';
import { isAcceptableWorkoutDate, isCalendarDate } from '../dates/workout-date';

export const IsWorkoutDate =
  (options?: ValidationOptions) => (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isWorkoutDate',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be YYYY-MM-DD or an ISO 8601 datetime with an explicit offset (Z or ±HH:MM), at most 24h in the future`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isAcceptableWorkoutDate(value, new Date()),
      },
    });

export const IsCalendarDate =
  (options?: ValidationOptions) => (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isCalendarDate',
      target: target.constructor,
      propertyName,
      options: { message: `${propertyName} must be a valid date in YYYY-MM-DD format`, ...options },
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isCalendarDate(value),
      },
    });
