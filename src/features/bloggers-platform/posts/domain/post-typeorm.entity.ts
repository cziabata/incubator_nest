import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BlogTypeOrm } from '../../blogs/domain/blog-typeorm.entity';
import { PostLikeTypeOrm } from './post-like-typeorm.entity';

@Entity('posts')
export class PostTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ name: 'short_description', type: 'varchar', nullable: false })
  shortDescription: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ name: 'blog_id', type: 'uuid', nullable: false })
  blogId: string;

  // Relations
  @ManyToOne(() => BlogTypeOrm, blog => blog.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: BlogTypeOrm;

  @OneToMany(() => PostLikeTypeOrm, like => like.post, { cascade: true })
  likes: PostLikeTypeOrm[];
} 