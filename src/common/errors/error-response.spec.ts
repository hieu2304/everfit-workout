import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';
import { toErrorResponse } from './error-response';

describe('toErrorResponse', () => {
  it('passes AppException through', () => {
    const ex = new AppException(404, ErrorCode.EXERCISE_NOT_FOUND, 'Exercise "x" not found');
    expect(toErrorResponse(ex)).toEqual({
      status: 404,
      body: { code: 'EXERCISE_NOT_FOUND', message: 'Exercise "x" not found', details: [] },
    });
  });

  it.each([
    [new NotFoundException('Cannot GET /nope'), 404, 'NOT_FOUND'],
    [new BadRequestException('Unexpected token'), 400, 'BAD_REQUEST'],
    [new PayloadTooLargeException(), 413, 'PAYLOAD_TOO_LARGE'],
    [new ServiceUnavailableException('Database unavailable'), 503, 'SERVICE_UNAVAILABLE'],
  ])('maps framework HttpException %#', (ex, status, code) => {
    const result = toErrorResponse(ex);
    expect(result.status).toBe(status);
    expect(result.body.code).toBe(code);
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    expect(toErrorResponse(new Error('db password is hunter2'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] },
    });
  });
});
