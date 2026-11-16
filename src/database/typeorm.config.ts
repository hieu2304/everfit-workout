import { DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';
import { InitialSchema1763280000000 } from './migrations/1763280000000-InitialSchema';
import { registerPgTypeParsers } from './pg-types';

export const buildDataSourceOptions = (url: string): DataSourceOptions => {
  registerPgTypeParsers();
  return {
    type: 'postgres',
    url,
    entities: ENTITIES,
    migrations: [InitialSchema1763280000000],
    synchronize: false,
  };
};
