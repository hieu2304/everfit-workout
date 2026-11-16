import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RECORD_METRICS, RecordMetric, RecordRow } from './records.types';

const METRIC_COLUMN: Record<RecordMetric, string> = {
  maxWeight: 'weight_kg',
  maxVolume: 'volume_kg',
  bestE1rm: 'e1rm_kg',
};

const bestOf = (metric: RecordMetric, source: string) => {
  const column = METRIC_COLUMN[metric];
  return `(SELECT '${metric}' AS metric, ${column}::text AS value_kg, weight_kg::text AS weight_kg, reps, local_date
           FROM ${source}
           ORDER BY ${column} DESC, performed_at ASC, id ASC
           LIMIT 1)`;
};

@Injectable()
export class RecordsRepository {
  constructor(private readonly dataSource: DataSource) {}

  findAllTime(userId: string, exerciseId: string): Promise<RecordRow[]> {
    const source = 'workout_sets WHERE user_id = $1 AND exercise_id = $2';
    return this.dataSource.query(
      RECORD_METRICS.map((metric) => bestOf(metric, source)).join(' UNION ALL '),
      [userId, exerciseId],
    );
  }

  findInRange(userId: string, exerciseId: string, from: string, to: string): Promise<RecordRow[]> {
    return this.dataSource.query(
      `WITH ranged AS MATERIALIZED (
         SELECT weight_kg, volume_kg, e1rm_kg, reps, local_date, performed_at, id
         FROM workout_sets
         WHERE user_id = $1 AND exercise_id = $2 AND local_date BETWEEN $3::date AND $4::date
       )
       ${RECORD_METRICS.map((metric) => bestOf(metric, 'ranged')).join(' UNION ALL ')}`,
      [userId, exerciseId, from, to],
    );
  }
}
