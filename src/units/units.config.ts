export const UNIT_FACTORS_TO_KG = {
  kg: '1',
  lb: '0.45359237',
} as const satisfies Record<string, string>;

export type WeightUnit = keyof typeof UNIT_FACTORS_TO_KG;

export const SUPPORTED_UNITS = Object.keys(UNIT_FACTORS_TO_KG) as WeightUnit[];

export const UNIT_FACTORS = Symbol('UNIT_FACTORS');
