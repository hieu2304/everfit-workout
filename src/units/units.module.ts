import { Global, Module } from '@nestjs/common';
import { UnitRegistry } from './unit-registry';
import { UNIT_FACTORS, UNIT_FACTORS_TO_KG } from './units.config';

@Global()
@Module({
  providers: [{ provide: UNIT_FACTORS, useValue: UNIT_FACTORS_TO_KG }, UnitRegistry],
  exports: [UnitRegistry],
})
export class UnitsModule {}
