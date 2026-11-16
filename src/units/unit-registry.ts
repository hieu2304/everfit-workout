import { Inject, Injectable } from '@nestjs/common';
import { round2 } from '../common/math';
import { UNIT_FACTORS } from './units.config';

@Injectable()
export class UnitRegistry {
  private readonly factors: ReadonlyMap<string, string>;

  constructor(@Inject(UNIT_FACTORS) factors: Readonly<Record<string, string>>) {
    this.factors = new Map(Object.entries(factors));
  }

  get units(): string[] {
    return [...this.factors.keys()];
  }

  factorToKg(unit: string): string {
    const factor = this.factors.get(unit);
    if (factor === undefined) throw new Error(`Unsupported unit: ${unit}`);
    return factor;
  }

  fromKg(valueKg: number, unit: string): number {
    return round2(valueKg / Number(this.factorToKg(unit)));
  }
}
