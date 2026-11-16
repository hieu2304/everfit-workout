import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { IsCalendarDate } from '../../common/validation/date.decorators';
import { SUPPORTED_UNITS } from '../../units/units.config';

export class RecordsQueryDto {
  @IsString()
  @Matches(/\S/, { message: 'exercise must not be blank' })
  @MaxLength(100)
  exercise!: string;

  @ApiPropertyOptional({ enum: SUPPORTED_UNITS, default: 'kg' })
  @IsIn(SUPPORTED_UNITS)
  unit: string = 'kg';

  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @IsOptional()
  @IsCalendarDate()
  compareFrom?: string;

  @IsOptional()
  @IsCalendarDate()
  compareTo?: string;
}
