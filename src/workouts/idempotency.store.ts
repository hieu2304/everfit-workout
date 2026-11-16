import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { IdempotencyKey } from '../database/entities';

export interface StoredResponse {
  statusCode: number;
  body: object;
}

@Injectable()
export class IdempotencyStore {
  async claim(
    manager: EntityManager,
    userId: string,
    key: string,
    requestHash: string,
  ): Promise<StoredResponse | null> {
    const inserted = await manager
      .createQueryBuilder()
      .insert()
      .into(IdempotencyKey)
      .values({ userId, key, requestHash })
      .orIgnore()
      .returning(['key'])
      .execute();
    if ((inserted.raw as unknown[]).length > 0) return null;
    const existing = await manager.findOneByOrFail(IdempotencyKey, { userId, key });
    if (existing.requestHash !== requestHash) {
      throw new AppException(
        422,
        ErrorCode.IDEMPOTENCY_KEY_REUSED,
        'Idempotency-Key was already used with a different request body',
      );
    }
    return { statusCode: existing.statusCode ?? 201, body: existing.responseBody ?? {} };
  }

  async complete(
    manager: EntityManager,
    userId: string,
    key: string,
    response: StoredResponse,
  ): Promise<void> {
    await manager.update(
      IdempotencyKey,
      { userId, key },
      { statusCode: response.statusCode, responseBody: response.body },
    );
  }
}
