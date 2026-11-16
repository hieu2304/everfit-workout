import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Exercise } from './exercise.entity';

@Entity({ name: 'workout_entries' })
export class WorkoutEntry {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise?: Exercise;

  @Column('timestamptz', { name: 'performed_at' })
  performedAt!: Date;

  @Column('date', { name: 'local_date' })
  localDate!: string;

  @Column('smallint', { name: 'utc_offset_minutes', nullable: true })
  utcOffsetMinutes!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
