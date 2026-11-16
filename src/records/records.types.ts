export const RECORD_METRICS = ['maxWeight', 'maxVolume', 'bestE1rm'] as const;

export type RecordMetric = (typeof RECORD_METRICS)[number];

export interface RecordRow {
  metric: RecordMetric;
  value_kg: string;
  weight_kg: string;
  reps: number;
  local_date: string;
}

export interface RecordValue {
  value: number;
  weight: number;
  reps: number;
  date: string;
}

export type PeriodRecords = Record<RecordMetric, RecordValue | null>;

export type RecordDelta = Record<RecordMetric, number | null>;
