import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsCalendarDate } from '../../common/validation/date.decorators';
import { SUPPORTED_UNITS } from '../../units/units.config';

export class HistoryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  exercise?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  muscleGroup?: string;

  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_UNITS, default: 'kg' })
  @IsIn(SUPPORTED_UNITS)
  unit: string = 'kg';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}
