import { isCalendarDate } from '../common/dates/workout-date';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';

export interface HistoryCursor {
  localDate: string;
  performedAt: string;
  id: string;
}

const UTC_MICROS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalidCursor = () => new AppException(400, ErrorCode.INVALID_CURSOR, 'Cursor is malformed');

export const encodeCursor = (cursor: HistoryCursor): string =>
  Buffer.from(JSON.stringify([cursor.localDate, cursor.performedAt, cursor.id])).toString(
    'base64url',
  );

export const decodeCursor = (raw: string): HistoryCursor => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 3 ||
    !parsed.every((part) => typeof part === 'string')
  ) {
    throw invalidCursor();
  }
  const [localDate, performedAt, id] = parsed as [string, string, string];
  if (!isCalendarDate(localDate) || !UTC_MICROS.test(performedAt) || !UUID.test(id)) {
    throw invalidCursor();
  }
  return { localDate, performedAt, id };
};
