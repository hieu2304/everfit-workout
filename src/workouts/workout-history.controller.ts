import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserIdParamDto } from '../common/validation/user-id.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryResponse, WorkoutHistoryService } from './workout-history.service';

@ApiTags('workouts')
@Controller('users/:userId/workouts')
export class WorkoutHistoryController {
  constructor(private readonly history: WorkoutHistoryService) {}

  @Get()
  list(@Param() params: UserIdParamDto, @Query() query: HistoryQueryDto): Promise<HistoryResponse> {
    return this.history.list(params.userId, query);
  }
}
