import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogTypeOrm } from '../domain/blog-typeorm.entity';
import { CreateBlogTypeOrmDto, UpdateBlogTypeOrmDto } from '../domain/types/blog-typeorm.types';
import { BlogTypeOrmFactory } from '../domain/blog-typeorm.factory';

@Injectable()
export class BlogsTypeOrmRepository {
  constructor(
    @InjectRepository(BlogTypeOrm)
    private blogsRepository: Repository<BlogTypeOrm>
  ) {}

  async findById(id: string): Promise<BlogTypeOrm | null> {
    return await this.blogsRepository.findOne({ where: { id } });
  }

  async findOrNotFoundFail(id: string): Promise<BlogTypeOrm> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async create(dto: CreateBlogTypeOrmDto): Promise<BlogTypeOrm> {
    const blog = BlogTypeOrmFactory.createBlog(dto);
    return await this.blogsRepository.save(blog);
  }

  async update(id: string, dto: UpdateBlogTypeOrmDto): Promise<void> {
    const blog = await this.findOrNotFoundFail(id);
    const updatedBlog = BlogTypeOrmFactory.updateBlog(blog, dto);
    await this.blogsRepository.save(updatedBlog);
  }

  async deleteById(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
    await this.blogsRepository.delete({ id });
  }

  async save(blog: BlogTypeOrm): Promise<BlogTypeOrm> {
    return await this.blogsRepository.save(blog);
  }
} 