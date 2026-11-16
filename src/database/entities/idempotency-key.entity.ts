import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'idempotency_keys' })
export class IdempotencyKey {
  @PrimaryColumn('text', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('text')
  key!: string;

  @Column('text', { name: 'request_hash' })
  requestHash!: string;

  @Column('smallint', { name: 'status_code', nullable: true })
  statusCode!: number | null;

  @Column('jsonb', { name: 'response_body', nullable: true })
  responseBody!: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
