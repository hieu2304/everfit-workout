import { envSchema } from './env.validation';

describe('envSchema', () => {
  it('requires DATABASE_URL', () => {
    const { error } = envSchema.validate({});
    expect(error?.message).toContain('"DATABASE_URL" is required');
  });

  it('applies defaults', () => {
    const { value, error } = envSchema.validate({
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    });
    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      PORT: 3000,
      LOG_LEVEL: 'info',
      NODE_ENV: 'development',
      EXERCISES_CONFIG_PATH: 'config/exercises.json',
    });
  });

  it('rejects non-postgres URLs', () => {
    const { error } = envSchema.validate({ DATABASE_URL: 'mysql://u:p@localhost/db' });
    expect(error).toBeDefined();
  });
});
