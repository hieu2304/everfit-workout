import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async () => {
  await (globalThis as { __PG_CONTAINER__?: StartedPostgreSqlContainer }).__PG_CONTAINER__?.stop();
};
