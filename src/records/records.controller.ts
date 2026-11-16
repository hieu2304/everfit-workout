import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserIdParamDto } from '../common/validation/user-id.dto';
import { RecordsQueryDto } from './dto/records-query.dto';
import { RecordsResponse, RecordsService } from './records.service';

@Controller('users/:userId/records')
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  get(@Param() params: UserIdParamDto, @Query() query: RecordsQueryDto): Promise<RecordsResponse> {
    return this.records.get(params.userId, query);
  }
}
