import { Injectable } from '@nestjs/common';
import { AppException, ErrorDetail, validationFailed } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { normalizeExerciseName } from '../exercises/exercise-name';
import { ExercisesRepository } from '../exercises/exercises.repository';
import { UnitRegistry } from '../units/unit-registry';
import { RecordsQueryDto } from './dto/records-query.dto';
import { buildPeriodRecords, computeDelta, hasAnyRecord } from './records-summary';
import { RecordsRepository } from './records.repository';
import { PeriodRecords, RecordDelta } from './records.types';

export type PeriodSummary = { from: string | null; to: string | null } & PeriodRecords;

export interface RecordsResponse {
  data: {
    exercise: string;
    unit: string;
    current: PeriodSummary;
    previous?: PeriodSummary;
    delta?: RecordDelta;
    message?: string;
  };
}

const EMPTY_MESSAGE = 'No sets found for this exercise in the given period';

const checkRanges = (query: RecordsQueryDto): ErrorDetail[] => {
  const problems: ErrorDetail[] = [];
  const pair = (
    from: string | undefined,
    to: string | undefined,
    fromPath: string,
    toPath: string,
  ) => {
    if (from === undefined && to !== undefined) {
      problems.push({ path: fromPath, message: `${fromPath} is required with ${toPath}` });
    }
    if (from !== undefined && to === undefined) {
      problems.push({ path: toPath, message: `${toPath} is required with ${fromPath}` });
    }
    if (from !== undefined && to !== undefined && from > to) {
      problems.push({ path: fromPath, message: `${fromPath} must be on or before ${toPath}` });
    }
  };
  pair(query.from, query.to, 'from', 'to');
  pair(query.compareFrom, query.compareTo, 'compareFrom', 'compareTo');
  const comparing = query.compareFrom !== undefined || query.compareTo !== undefined;
  if (comparing && query.from === undefined && query.to === undefined) {
    problems.push({ path: 'from', message: 'from and to are required when comparing periods' });
  }
  return problems;
};

@Injectable()
export class RecordsService {
  constructor(
    private readonly exercises: ExercisesRepository,
    private readonly records: RecordsRepository,
    private readonly units: UnitRegistry,
  ) {}

  async get(userId: string, query: RecordsQueryDto): Promise<RecordsResponse> {
    const problems = checkRanges(query);
    if (problems.length > 0) throw validationFailed(problems);
    const exercise = await this.exercises.findByNormalizedName(
      normalizeExerciseName(query.exercise),
    );
    if (exercise === null) {
      throw new AppException(
        404,
        ErrorCode.EXERCISE_NOT_FOUND,
        `Exercise "${query.exercise}" not found`,
      );
    }
    const current = await this.summarize(userId, exercise.id, query.unit, query.from, query.to);
    const previous =
      query.compareFrom !== undefined && query.compareTo !== undefined
        ? await this.summarize(userId, exercise.id, query.unit, query.compareFrom, query.compareTo)
        : undefined;
    return {
      data: {
        exercise: exercise.name,
        unit: query.unit,
        current,
        ...(previous !== undefined ? { previous, delta: computeDelta(current, previous) } : {}),
        ...(hasAnyRecord(current) ? {} : { message: EMPTY_MESSAGE }),
      },
    };
  }

  private async summarize(
    userId: string,
    exerciseId: string,
    unit: string,
    from?: string,
    to?: string,
  ): Promise<PeriodSummary> {
    const rows = await this.records.findBest(
      userId,
      exerciseId,
      from !== undefined && to !== undefined ? { from, to } : undefined,
    );
    return { from: from ?? null, to: to ?? null, ...buildPeriodRecords(rows, unit, this.units) };
  }
}
