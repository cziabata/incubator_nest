import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PostTypeOrm } from './post-typeorm.entity';
import { LikeStatus } from '../../../../core/dto/likes';

@Entity('post_likes')
export class PostLikeTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: false })
  postId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  login: string;

  @Column({ 
    type: 'varchar',
    length: 10,
    nullable: false 
  })
  status: LikeStatus;

  @CreateDateColumn({ name: 'added_at', type: 'timestamp with time zone' })
  addedAt: Date;

  // Relations
  @ManyToOne(() => PostTypeOrm, post => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostTypeOrm;
} 