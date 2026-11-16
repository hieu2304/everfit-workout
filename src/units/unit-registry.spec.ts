import { UnitRegistry } from './unit-registry';
import { UNIT_FACTORS_TO_KG } from './units.config';

describe('UnitRegistry', () => {
  const registry = new UnitRegistry(UNIT_FACTORS_TO_KG);

  it('lists supported units', () => {
    expect(registry.units).toEqual(['kg', 'lb']);
  });

  it('exposes exact decimal factors as strings for SQL', () => {
    expect(registry.factorToKg('lb')).toBe('0.45359237');
    expect(registry.factorToKg('kg')).toBe('1');
  });

  it('converts kg to the requested unit rounded to 2 decimals', () => {
    expect(registry.fromKg(102.05828325, 'lb')).toBe(225);
    expect(registry.fromKg(100, 'lb')).toBe(220.46);
    expect(registry.fromKg(100, 'kg')).toBe(100);
  });

  it('rejects unknown units', () => {
    expect(() => registry.factorToKg('stone')).toThrow('Unsupported unit: stone');
  });

  it('supports a new unit by configuration only', () => {
    const extended = new UnitRegistry({ ...UNIT_FACTORS_TO_KG, stone: '6.35029318' });
    expect(extended.units).toContain('stone');
    expect(extended.fromKg(63.5029318, 'stone')).toBe(10);
  });
});
