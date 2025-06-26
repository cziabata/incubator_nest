import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CommentTypeOrm } from './comment-typeorm.entity';
import { LikeStatus } from '../../../../core/dto/likes';

@Entity('comment_likes')
export class CommentLikeTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id', type: 'uuid', nullable: false })
  commentId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ 
    type: 'varchar',
    length: 10,
    nullable: false 
  })
  status: LikeStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CommentTypeOrm, comment => comment.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: CommentTypeOrm;
} 