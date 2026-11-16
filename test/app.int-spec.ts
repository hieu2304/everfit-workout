import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from './helpers/test-app';

describe('app', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => app.close());

  it('GET /health reports ok', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });

  it('unknown route returns the structured error body with requestId', async () => {
    const res = await request(app.getHttpServer()).get('/nope').expect(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Cannot GET /nope', details: [] },
      requestId: expect.any(String),
    });
  });

  it('echoes a client-supplied X-Request-Id', async () => {
    const res = await request(app.getHttpServer())
      .get('/nope')
      .set('X-Request-Id', 'abc-123')
      .expect(404);
    expect(res.headers['x-request-id']).toBe('abc-123');
    expect(res.body.requestId).toBe('abc-123');
  });
});
