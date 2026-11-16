import { round2 } from '../common/math';
import { UnitRegistry } from '../units/unit-registry';
import {
  PeriodRecords,
  RECORD_METRICS,
  RecordDelta,
  RecordRow,
  RecordValue,
} from './records.types';

export const buildPeriodRecords = (
  rows: RecordRow[],
  unit: string,
  units: UnitRegistry,
): PeriodRecords => {
  const byMetric = new Map(rows.map((row) => [row.metric, row]));
  const toValue = (row: RecordRow | undefined): RecordValue | null =>
    row === undefined
      ? null
      : {
          value: units.fromKg(Number(row.value_kg), unit),
          weight: units.fromKg(Number(row.weight_kg), unit),
          reps: row.reps,
          date: row.local_date,
        };
  return {
    maxWeight: toValue(byMetric.get('maxWeight')),
    maxVolume: toValue(byMetric.get('maxVolume')),
    bestE1rm: toValue(byMetric.get('bestE1rm')),
  };
};

export const computeDelta = (current: PeriodRecords, previous: PeriodRecords): RecordDelta =>
  RECORD_METRICS.reduce((acc, metric) => {
    const now = current[metric];
    const before = previous[metric];
    acc[metric] = now === null || before === null ? null : round2(now.value - before.value);
    return acc;
  }, {} as RecordDelta);

export const hasAnyRecord = (records: PeriodRecords): boolean =>
  RECORD_METRICS.some((metric) => records[metric] !== null);
