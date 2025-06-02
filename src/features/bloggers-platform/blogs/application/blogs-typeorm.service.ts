import { Injectable } from '@nestjs/common';
import { BlogsTypeOrmRepository } from '../infrastructure/blogs-typeorm.repository';
import { CreateBlogTypeOrmDto, UpdateBlogTypeOrmDto } from '../domain/types/blog-typeorm.types';
import { BlogTypeOrm } from '../domain/blog-typeorm.entity';

@Injectable()
export class BlogsTypeOrmService {
  constructor(
    private blogsRepository: BlogsTypeOrmRepository
  ) {}

  async createBlog(dto: CreateBlogTypeOrmDto): Promise<BlogTypeOrm> {
    return await this.blogsRepository.create(dto);
  }

  async updateBlog(id: string, dto: UpdateBlogTypeOrmDto): Promise<void> {
    await this.blogsRepository.update(id, dto);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteById(id);
  }

  async getBlogById(id: string): Promise<BlogTypeOrm> {
    return await this.blogsRepository.findOrNotFoundFail(id);
  }
} 