import { Injectable } from '@nestjs/common';
import { PostsTypeOrmRepository } from '../infrastructure/posts-typeorm.repository';
import { BlogsTypeOrmService } from '../../blogs/application/blogs-typeorm.service';
import { CreatePostTypeOrmDto, UpdatePostTypeOrmDto, CreatePostForSpecificBlogTypeOrmDto } from '../domain/types/post-typeorm.types';
import { PostTypeOrm } from '../domain/post-typeorm.entity';
import { LikeStatus } from '../../../../core/dto/likes';

@Injectable()
export class PostsTypeOrmService {
  constructor(
    private postsRepository: PostsTypeOrmRepository,
    private blogsService: BlogsTypeOrmService
  ) {}

  async createPost(dto: CreatePostTypeOrmDto): Promise<PostTypeOrm> {
    // Проверяем существование блога
    await this.blogsService.getBlogById(dto.blogId);
    return await this.postsRepository.create(dto);
  }

  async createPostForSpecificBlog(dto: CreatePostForSpecificBlogTypeOrmDto, blogId: string): Promise<PostTypeOrm> {
    // Проверяем существование блога
    await this.blogsService.getBlogById(blogId);
    return await this.postsRepository.createForSpecificBlog(dto, blogId);
  }

  async updatePost(id: string, dto: UpdatePostTypeOrmDto): Promise<void> {
    // Если обновляется blogId, проверяем существование нового блога
    if (dto.blogId) {
      await this.blogsService.getBlogById(dto.blogId);
    }
    await this.postsRepository.update(id, dto);
  }

  async deletePost(id: string): Promise<void> {
    await this.postsRepository.deleteById(id);
  }

  async getPostById(id: string): Promise<PostTypeOrm> {
    return await this.postsRepository.findOrNotFoundFail(id);
  }

  async updatePostLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatus
  ): Promise<boolean> {
    return await this.postsRepository.updateLikeStatus(postId, userId, userLogin, likeStatus);
  }

  async getPostsByBlogId(blogId: string): Promise<PostTypeOrm[]> {
    // Проверяем существование блога
    await this.blogsService.getBlogById(blogId);
    return await this.postsRepository.findPostsByBlogId(blogId);
  }
} 