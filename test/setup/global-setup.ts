import { PostgreSqlContainer } from '@testcontainers/postgresql';

export default async () => {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  (globalThis as { __PG_CONTAINER__?: unknown }).__PG_CONTAINER__ = container;
};
