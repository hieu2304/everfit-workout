import { UnitRegistry } from '../units/unit-registry';
import { UNIT_FACTORS_TO_KG } from '../units/units.config';
import { buildPeriodRecords, computeDelta, hasAnyRecord } from './records-summary';
import { RecordRow } from './records.types';

const units = new UnitRegistry(UNIT_FACTORS_TO_KG);

const rows: RecordRow[] = [
  { metric: 'maxWeight', value_kg: '110', weight_kg: '110', reps: 2, local_date: '2026-10-20' },
  { metric: 'maxVolume', value_kg: '500', weight_kg: '100', reps: 5, local_date: '2026-10-05' },
  {
    metric: 'bestE1rm',
    value_kg: '117.33333333333333333333',
    weight_kg: '110',
    reps: 2,
    local_date: '2026-10-20',
  },
];

describe('buildPeriodRecords', () => {
  it('shapes rows in kg', () => {
    expect(buildPeriodRecords(rows, 'kg', units)).toEqual({
      maxWeight: { value: 110, weight: 110, reps: 2, date: '2026-10-20' },
      maxVolume: { value: 500, weight: 100, reps: 5, date: '2026-10-05' },
      bestE1rm: { value: 117.33, weight: 110, reps: 2, date: '2026-10-20' },
    });
  });

  it('converts to lb', () => {
    expect(buildPeriodRecords(rows, 'lb', units).maxWeight).toEqual({
      value: 242.51,
      weight: 242.51,
      reps: 2,
      date: '2026-10-20',
    });
  });

  it('returns nulls when there are no rows', () => {
    const empty = buildPeriodRecords([], 'kg', units);
    expect(empty).toEqual({ maxWeight: null, maxVolume: null, bestE1rm: null });
    expect(hasAnyRecord(empty)).toBe(false);
  });
});

describe('computeDelta', () => {
  it('subtracts previous from current and nulls missing sides', () => {
    const current = buildPeriodRecords(
      [
        {
          metric: 'maxWeight',
          value_kg: '105',
          weight_kg: '105',
          reps: 5,
          local_date: '2026-11-03',
        },
        {
          metric: 'bestE1rm',
          value_kg: '122.5',
          weight_kg: '105',
          reps: 5,
          local_date: '2026-11-03',
        },
      ],
      'kg',
      units,
    );
    const previous = buildPeriodRecords(rows, 'kg', units);
    expect(computeDelta(current, previous)).toEqual({
      maxWeight: -5,
      maxVolume: null,
      bestE1rm: 5.17,
    });
  });
});
