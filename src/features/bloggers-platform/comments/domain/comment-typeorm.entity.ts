import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PostTypeOrm } from '../../posts/domain/post-typeorm.entity';
import { CommentLikeTypeOrm } from './comment-like-typeorm.entity';

@Entity('comments')
export class CommentTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: false })
  postId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'user_login', type: 'varchar', length: 255, nullable: false })
  userLogin: string;

  // Relations
  @ManyToOne(() => PostTypeOrm, post => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostTypeOrm;

  @OneToMany(() => CommentLikeTypeOrm, like => like.comment, { cascade: true })
  likes: CommentLikeTypeOrm[];
} 