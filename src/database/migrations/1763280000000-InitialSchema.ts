import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763280000000 implements MigrationInterface {
  name = 'InitialSchema1763280000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`
      CREATE TABLE exercises (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        normalized_name text NOT NULL UNIQUE,
        muscle_groups text[] NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX exercises_normalized_name_trgm ON exercises USING gin (normalized_name gin_trgm_ops)`,
    );

    await queryRunner.query(`
      CREATE TABLE workout_entries (
        id uuid PRIMARY KEY,
        user_id text NOT NULL,
        exercise_id uuid NOT NULL REFERENCES exercises(id),
        performed_at timestamptz NOT NULL,
        local_date date NOT NULL,
        utc_offset_minutes smallint,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX workout_entries_user_history ON workout_entries (user_id, local_date DESC, performed_at DESC, id DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX workout_entries_user_exercise_history ON workout_entries (user_id, exercise_id, local_date DESC, performed_at DESC, id DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE workout_sets (
        id uuid PRIMARY KEY,
        entry_id uuid NOT NULL REFERENCES workout_entries(id) ON DELETE CASCADE,
        set_index smallint NOT NULL,
        user_id text NOT NULL,
        exercise_id uuid NOT NULL,
        local_date date NOT NULL,
        performed_at timestamptz NOT NULL,
        reps integer NOT NULL CHECK (reps > 0),
        weight numeric NOT NULL CHECK (weight >= 0),
        unit text NOT NULL,
        weight_kg numeric NOT NULL CHECK (weight_kg >= 0),
        volume_kg numeric GENERATED ALWAYS AS (reps * weight_kg) STORED,
        e1rm_kg numeric GENERATED ALWAYS AS (weight_kg * (1 + reps / 30.0)) STORED,
        CONSTRAINT workout_sets_entry_order UNIQUE (entry_id, set_index)
      )`);
    await queryRunner.query(
      `CREATE INDEX workout_sets_pr_weight ON workout_sets (user_id, exercise_id, weight_kg DESC, performed_at, id)`,
    );
    await queryRunner.query(
      `CREATE INDEX workout_sets_pr_volume ON workout_sets (user_id, exercise_id, volume_kg DESC, performed_at, id)`,
    );
    await queryRunner.query(
      `CREATE INDEX workout_sets_pr_e1rm ON workout_sets (user_id, exercise_id, e1rm_kg DESC, performed_at, id)`,
    );
    await queryRunner.query(
      `CREATE INDEX workout_sets_pr_range ON workout_sets (user_id, exercise_id, local_date) INCLUDE (reps, weight_kg, volume_kg, e1rm_kg, performed_at, id)`,
    );

    await queryRunner.query(`
      CREATE TABLE idempotency_keys (
        user_id text NOT NULL,
        key text NOT NULL,
        request_hash text NOT NULL,
        status_code smallint,
        response_body jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, key)
      )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE idempotency_keys`);
    await queryRunner.query(`DROP TABLE workout_sets`);
    await queryRunner.query(`DROP TABLE workout_entries`);
    await queryRunner.query(`DROP TABLE exercises`);
  }
}
