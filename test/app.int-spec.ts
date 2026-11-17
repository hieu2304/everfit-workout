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

  it('includes requestId when the JSON body cannot be parsed', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .set('Content-Type', 'application/json')
      .set('X-Request-Id', 'bad-json-1')
      .send('{"entries": [')
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.requestId).toBe('bad-json-1');
    expect(res.headers['x-request-id']).toBe('bad-json-1');
  });

  it('includes a generated requestId when the body is over 1 MB', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/u1/workouts')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(1024 * 1024) }))
      .expect(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(res.body.requestId).toEqual(expect.any(String));
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});
