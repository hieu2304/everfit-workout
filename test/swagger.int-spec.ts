import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from './helpers/test-app';

describe('OpenAPI', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => app.close());

  it('documents every endpoint', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(Object.keys(res.body.paths).sort()).toEqual([
      '/health',
      '/users/{userId}/records',
      '/users/{userId}/workouts',
    ]);
    const postParams = res.body.paths['/users/{userId}/workouts'].post.parameters;
    expect(postParams.map((p: { name: string }) => p.name)).toContain('Idempotency-Key');
  });
});
