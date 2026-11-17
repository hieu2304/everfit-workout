import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

const MAX_REQUEST_ID_LENGTH = 128;

export const resolveRequestId = (req: IncomingMessage, res: ServerResponse): string => {
  if (typeof req.id === 'string') return req.id;
  const header = req.headers['x-request-id'];
  const id =
    typeof header === 'string' && header.length > 0 && header.length <= MAX_REQUEST_ID_LENGTH
      ? header
      : randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  return id;
};

export const requestIdMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void => {
  resolveRequestId(req, res);
  next();
};
