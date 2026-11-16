import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserIdParamDto } from '../common/validation/user-id.dto';
import { LogWorkoutsDto } from './dto/log-workouts.dto';
import { LogWorkoutsResponse } from './logged-response';
import { WorkoutsService } from './workouts.service';

@Controller('users/:userId/workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  async log(
    @Param() params: UserIdParamDto,
    @Body() dto: LogWorkoutsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogWorkoutsResponse> {
    const result = await this.workouts.log(params.userId, dto);
    res.status(result.statusCode);
    return result.body;
  }
}
