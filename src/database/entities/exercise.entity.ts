import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'exercises' })
export class Exercise {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text', { name: 'normalized_name', unique: true })
  normalizedName!: string;

  @Column('text', { name: 'muscle_groups', array: true, default: () => "'{}'" })
  muscleGroups!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
