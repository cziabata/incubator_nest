import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens_black_list')
export class BlacklistedRefreshTokenTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    nullable: true 
  })
  token: string;

  @CreateDateColumn({ 
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_DATE'
  })
  created_at: Date;
} 