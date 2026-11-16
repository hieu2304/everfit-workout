import { Body, Controller, Headers, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { validationFailed } from '../common/errors/app.exception';
import { UserIdParamDto } from '../common/validation/user-id.dto';
import { LogWorkoutsDto } from './dto/log-workouts.dto';
import { LogWorkoutsResponse } from './logged-response';
import { WorkoutsService } from './workouts.service';

const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

@Controller('users/:userId/workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  async log(
    @Param() params: UserIdParamDto,
    @Body() dto: LogWorkoutsDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogWorkoutsResponse> {
    if (
      idempotencyKey !== undefined &&
      (idempotencyKey.length === 0 || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH)
    ) {
      throw validationFailed([
        {
          path: 'Idempotency-Key',
          message: `Idempotency-Key must be 1-${MAX_IDEMPOTENCY_KEY_LENGTH} characters`,
        },
      ]);
    }
    const result = await this.workouts.log(params.userId, dto, idempotencyKey);
    res.status(result.statusCode);
    if (result.replayed) res.setHeader('Idempotent-Replayed', 'true');
    return result.body;
  }
}
