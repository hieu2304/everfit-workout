import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsWorkoutDate } from '../../common/validation/date.decorators';
import { SUPPORTED_UNITS } from '../../units/units.config';

export class WorkoutSetDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  reps!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(2000)
  weight!: number;

  @ApiProperty({ enum: SUPPORTED_UNITS })
  @IsIn(SUPPORTED_UNITS)
  unit!: string;
}

export class WorkoutEntryDto {
  @IsString()
  @Matches(/\S/, { message: 'exerciseName must not be blank' })
  @MaxLength(100)
  exerciseName!: string;

  @ApiProperty({
    example: '2026-11-16T07:30:00+07:00',
    description: 'YYYY-MM-DD or ISO 8601 datetime with explicit offset',
  })
  @IsWorkoutDate()
  date!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WorkoutSetDto)
  sets!: WorkoutSetDto[];
}

export class LogWorkoutsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WorkoutEntryDto)
  entries!: WorkoutEntryDto[];
}
