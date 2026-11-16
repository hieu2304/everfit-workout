import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSet } from '../database/entities';
import { RECORD_METRICS, RecordMetric, RecordRow } from './records.types';

const METRIC_PROPERTY: Record<RecordMetric, 'weightKg' | 'volumeKg' | 'e1rmKg'> = {
  maxWeight: 'weightKg',
  maxVolume: 'volumeKg',
  bestE1rm: 'e1rmKg',
};

export interface DateRange {
  from: string;
  to: string;
}

@Injectable()
export class RecordsRepository {
  constructor(@InjectRepository(WorkoutSet) private readonly sets: Repository<WorkoutSet>) {}

  async findBest(userId: string, exerciseId: string, range?: DateRange): Promise<RecordRow[]> {
    const rows = await Promise.all(
      RECORD_METRICS.map((metric) => this.findBestFor(metric, userId, exerciseId, range)),
    );
    return rows.filter((row): row is RecordRow => row !== null);
  }

  private async findBestFor(
    metric: RecordMetric,
    userId: string,
    exerciseId: string,
    range?: DateRange,
  ): Promise<RecordRow | null> {
    const property = METRIC_PROPERTY[metric];
    const query = this.sets
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.exerciseId = :exerciseId', { exerciseId });
    if (range !== undefined) {
      query.andWhere('s.localDate BETWEEN :from AND :to', range);
    }
    const best = await query
      .orderBy(`s.${property}`, 'DESC')
      .addOrderBy('s.performedAt', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .limit(1)
      .getOne();
    if (best === null) return null;
    return {
      metric,
      value_kg: best[property],
      weight_kg: best.weightKg,
      reps: best.reps,
      local_date: best.localDate,
    };
  }
}
