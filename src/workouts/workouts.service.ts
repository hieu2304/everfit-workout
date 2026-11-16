import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from '../exercises/exercises.repository';
import { UnitRegistry } from '../units/unit-registry';
import { LogWorkoutsDto } from './dto/log-workouts.dto';
import { buildInsertPlan } from './insert-plan';
import { LogWorkoutsResponse, toLoggedResponse } from './logged-response';
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
    private readonly units: UnitRegistry,
  ) {}

  async log(userId: string, dto: LogWorkoutsDto): Promise<LogResult> {
    const exerciseByKey = await this.exercises.ensureExist(
      dto.entries.map((entry) => entry.exerciseName),
    );
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      const plan = buildInsertPlan(userId, dto, exerciseByKey, this.units);
      await this.workouts.insertEntries(manager, plan);
      const weightKgBySetId = await this.workouts.insertSets(manager, plan);
      return {
        statusCode: HttpStatus.CREATED,
        body: toLoggedResponse(plan, weightKgBySetId),
        replayed: false,
      };
    });
  }
}
