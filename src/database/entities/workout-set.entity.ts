import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WorkoutEntry } from './workout-entry.entity';

@Entity({ name: 'workout_sets' })
export class WorkoutSet {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'entry_id' })
  entryId!: string;

  @ManyToOne(() => WorkoutEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry?: WorkoutEntry;

  @Column('smallint', { name: 'set_index' })
  setIndex!: number;

  @Column('text', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @Column('date', { name: 'local_date' })
  localDate!: string;

  @Column('timestamptz', { name: 'performed_at' })
  performedAt!: Date;

  @Column('integer')
  reps!: number;

  @Column('numeric')
  weight!: string;

  @Column('text')
  unit!: string;

  @Column('numeric', { name: 'weight_kg' })
  weightKg!: string;

  @Column({
    type: 'numeric',
    name: 'volume_kg',
    generatedType: 'STORED',
    asExpression: 'reps * weight_kg',
    insert: false,
    update: false,
  })
  volumeKg!: string;

  @Column({
    type: 'numeric',
    name: 'e1rm_kg',
    generatedType: 'STORED',
    asExpression: 'weight_kg * (1 + reps / 30.0)',
    insert: false,
    update: false,
  })
  e1rmKg!: string;
}
