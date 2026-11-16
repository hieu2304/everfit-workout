import { DataSourceOptions } from 'typeorm';
import { InitialSchema1763280000000 } from './migrations/1763280000000-InitialSchema';
import { registerPgTypeParsers } from './pg-types';

export const buildDataSourceOptions = (url: string): DataSourceOptions => {
  registerPgTypeParsers();
  return {
    type: 'postgres',
    url,
    entities: [],
    migrations: [InitialSchema1763280000000],
    synchronize: false,
  };
};
