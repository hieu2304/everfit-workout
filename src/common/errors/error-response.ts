import { HttpException } from '@nestjs/common';
import { AppException, ErrorDetail } from './app.exception';
import { ErrorCode } from './error-codes';

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  details: ErrorDetail[];
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ErrorCode.BAD_REQUEST,
  404: ErrorCode.NOT_FOUND,
  413: ErrorCode.PAYLOAD_TOO_LARGE,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

const exposedClientError = (exception: unknown): { status: number; message: string } | null => {
  if (!(exception instanceof Error)) return null;
  const { status, expose } = exception as Error & { status?: unknown; expose?: unknown };
  if (expose !== true || typeof status !== 'number' || status < 400 || status >= 500) return null;
  return { status, message: exception.message };
};

export const toErrorResponse = (exception: unknown): { status: number; body: ErrorBody } => {
  if (exception instanceof AppException) {
    return {
      status: exception.getStatus(),
      body: { code: exception.code, message: exception.message, details: exception.details },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return {
      status,
      body: {
        code: CODE_BY_STATUS[status] ?? ErrorCode.HTTP_ERROR,
        message: exception.message,
        details: [],
      },
    };
  }
  const clientError = exposedClientError(exception);
  if (clientError) {
    return {
      status: clientError.status,
      body: {
        code: CODE_BY_STATUS[clientError.status] ?? ErrorCode.HTTP_ERROR,
        message: clientError.message,
        details: [],
      },
    };
  }
  return {
    status: 500,
    body: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error', details: [] },
  };
};
