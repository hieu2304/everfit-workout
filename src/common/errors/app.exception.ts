import { HttpException } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export interface ErrorDetail {
  path: string;
  message: string;
}

export class AppException extends HttpException {
  constructor(
    status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message, status);
  }
}

export const validationFailed = (details: ErrorDetail[]): AppException =>
  new AppException(400, ErrorCode.VALIDATION_FAILED, 'Request validation failed', details);
