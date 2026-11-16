import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';

export interface StoredResponse {
  statusCode: number;
  body: unknown;
}

@Injectable()
export class IdempotencyStore {
  async claim(
    manager: EntityManager,
    userId: string,
    key: string,
    requestHash: string,
  ): Promise<StoredResponse | null> {
    const inserted: unknown[] = await manager.query(
      `INSERT INTO idempotency_keys (user_id, key, request_hash) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO NOTHING RETURNING key`,
      [userId, key, requestHash],
    );
    if (inserted.length > 0) return null;
    const [row]: { request_hash: string; status_code: number; response_body: unknown }[] =
      await manager.query(
        `SELECT request_hash, status_code, response_body FROM idempotency_keys
         WHERE user_id = $1 AND key = $2`,
        [userId, key],
      );
    if (row.request_hash !== requestHash) {
      throw new AppException(
        422,
        ErrorCode.IDEMPOTENCY_KEY_REUSED,
        'Idempotency-Key was already used with a different request body',
      );
    }
    return { statusCode: row.status_code, body: row.response_body };
  }

  async complete(
    manager: EntityManager,
    userId: string,
    key: string,
    response: StoredResponse,
  ): Promise<void> {
    await manager.query(
      `UPDATE idempotency_keys SET status_code = $3, response_body = $4::jsonb
       WHERE user_id = $1 AND key = $2`,
      [userId, key, response.statusCode, JSON.stringify(response.body)],
    );
  }
}
