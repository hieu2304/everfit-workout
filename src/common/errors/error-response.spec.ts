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

  it('maps exposed 4xx errors from Express middleware such as the body parser', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
      type: 'entity.too.large',
    });
    expect(toErrorResponse(tooLarge)).toEqual({
      status: 413,
      body: { code: 'PAYLOAD_TOO_LARGE', message: 'request entity too large', details: [] },
    });
  });

  it('keeps non-exposed middleware errors as INTERNAL_ERROR', () => {
    const hidden = Object.assign(new Error('secret'), { status: 500, expose: false });
    expect(toErrorResponse(hidden).status).toBe(500);
    expect(toErrorResponse(hidden).body.code).toBe('INTERNAL_ERROR');
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    expect(toErrorResponse(new Error('db password is hunter2'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] },
    });
  });
});
