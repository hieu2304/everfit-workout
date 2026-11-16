import { AppException } from '../common/errors/app.exception';
import { decodeCursor, encodeCursor } from './history-cursor';

const cursor = {
  localDate: '2026-11-16',
  performedAt: '2026-11-16T16:00:00.123456Z',
  id: '0193a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('history cursor', () => {
  it('round-trips with microsecond precision', () => {
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it.each([
    'not-base64-json',
    encode({ a: 1 }),
    encode(['2026-02-30', cursor.performedAt, cursor.id]),
    encode([cursor.localDate, 'yesterday', cursor.id]),
    encode([cursor.localDate, cursor.performedAt, 'x']),
  ])('rejects malformed cursor %#', (raw) => {
    let caught: unknown;
    try {
      decodeCursor(raw);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppException);
    expect((caught as AppException).code).toBe('INVALID_CURSOR');
  });
});
