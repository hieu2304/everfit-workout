import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises/exercises.module';
import { RecordsController } from './records.controller';
import { RecordsRepository } from './records.repository';
import { RecordsService } from './records.service';

@Module({
  imports: [ExercisesModule],
  controllers: [RecordsController],
  providers: [RecordsService, RecordsRepository],
})
export class RecordsModule {}
