import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PostTypeOrm } from '../../posts/domain/post-typeorm.entity';

@Entity('blogs')
export class BlogTypeOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  description: string;

  @Column({ name: 'website_url', type: 'varchar', nullable: false })
  websiteUrl: string;

  @Column({ name: 'is_membership', type: 'boolean', default: false, nullable: false })
  isMembership: boolean;

  // Relations
  @OneToMany(() => PostTypeOrm, post => post.blog, { cascade: true })
  posts: PostTypeOrm[];
} 