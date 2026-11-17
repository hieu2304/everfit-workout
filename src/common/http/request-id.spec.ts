import { IncomingMessage, ServerResponse } from 'node:http';
import { resolveRequestId } from './request-id';

const fakeReq = (headers: Record<string, string> = {}): IncomingMessage =>
  ({ headers }) as unknown as IncomingMessage;

const fakeRes = (): ServerResponse & { headers: Record<string, string> } => {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  } as unknown as ServerResponse & { headers: Record<string, string> };
};

describe('resolveRequestId', () => {
  it('uses a client-supplied X-Request-Id and echoes it', () => {
    const req = fakeReq({ 'x-request-id': 'abc-123' });
    const res = fakeRes();
    expect(resolveRequestId(req, res)).toBe('abc-123');
    expect(req.id).toBe('abc-123');
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('generates a UUID when the header is missing or longer than 128 chars', () => {
    expect(resolveRequestId(fakeReq(), fakeRes())).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveRequestId(fakeReq({ 'x-request-id': 'x'.repeat(129) }), fakeRes())).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it('returns the id already assigned to the request', () => {
    const req = fakeReq({ 'x-request-id': 'first' });
    resolveRequestId(req, fakeRes());
    const res = fakeRes();
    expect(resolveRequestId(req, res)).toBe('first');
    expect(res.headers).toEqual({});
  });
});
