import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from '../exercises/exercises.repository';
import { UnitRegistry } from '../units/unit-registry';
import { LogWorkoutsDto } from './dto/log-workouts.dto';
import { IdempotencyStore } from './idempotency.store';
import { buildInsertPlan } from './insert-plan';
import { LogWorkoutsResponse, toLoggedResponse } from './logged-response';
import { hashRequest } from './request-hash';
import { WorkoutsRepository } from './workouts.repository';

export interface LogResult {
  statusCode: number;
  body: LogWorkoutsResponse;
  replayed: boolean;
}

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly exercises: ExercisesRepository,
    private readonly workouts: WorkoutsRepository,
    private readonly idempotency: IdempotencyStore,
    private readonly units: UnitRegistry,
  ) {}

  async log(userId: string, dto: LogWorkoutsDto, idempotencyKey?: string): Promise<LogResult> {
    const exerciseByKey = await this.exercises.ensureExist(
      dto.entries.map((entry) => entry.exerciseName),
    );
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      if (idempotencyKey !== undefined) {
        const stored = await this.idempotency.claim(
          manager,
          userId,
          idempotencyKey,
          hashRequest(dto),
        );
        if (stored !== null) {
          return {
            statusCode: stored.statusCode,
            body: stored.body as LogWorkoutsResponse,
            replayed: true,
          };
        }
      }
      const plan = buildInsertPlan(userId, dto, exerciseByKey, this.units);
      await this.workouts.insertEntries(manager, plan);
      const body = toLoggedResponse(plan, await this.workouts.insertSets(manager, plan));
      if (idempotencyKey !== undefined) {
        await this.idempotency.complete(manager, userId, idempotencyKey, {
          statusCode: HttpStatus.CREATED,
          body,
        });
      }
      return { statusCode: HttpStatus.CREATED, body, replayed: false };
    });
  }
}
