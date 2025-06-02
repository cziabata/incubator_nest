import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostTypeOrm } from '../domain/post-typeorm.entity';
import { PostLikeTypeOrm } from '../domain/post-like-typeorm.entity';
import { CreatePostTypeOrmDto, UpdatePostTypeOrmDto, CreatePostForSpecificBlogTypeOrmDto } from '../domain/types/post-typeorm.types';
import { PostTypeOrmFactory } from '../domain/post-typeorm.factory';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class PostsTypeOrmRepository {
  constructor(
    @InjectRepository(PostTypeOrm)
    private postsRepository: Repository<PostTypeOrm>,
    @InjectRepository(PostLikeTypeOrm)
    private postLikesRepository: Repository<PostLikeTypeOrm>
  ) {}

  async findById(id: string): Promise<PostTypeOrm | null> {
    return await this.postsRepository.findOne({ 
      where: { id },
      relations: ['blog']
    });
  }

  async findOrNotFoundFail(id: string): Promise<PostTypeOrm> {
    const post = await this.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async create(dto: CreatePostTypeOrmDto): Promise<PostTypeOrm> {
    const post = PostTypeOrmFactory.createPost(dto);
    return await this.postsRepository.save(post);
  }

  async createForSpecificBlog(dto: CreatePostForSpecificBlogTypeOrmDto, blogId: string): Promise<PostTypeOrm> {
    const post = PostTypeOrmFactory.createPostForSpecificBlog(dto, blogId);
    return await this.postsRepository.save(post);
  }

  async update(id: string, dto: UpdatePostTypeOrmDto): Promise<void> {
    const post = await this.findOrNotFoundFail(id);
    const updatedPost = PostTypeOrmFactory.updatePost(post, dto);
    await this.postsRepository.save(updatedPost);
  }

  async deleteById(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
    await this.postsRepository.delete({ id });
  }

  async save(post: PostTypeOrm): Promise<PostTypeOrm> {
    return await this.postsRepository.save(post);
  }

  async updateLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatus,
  ): Promise<boolean> {
    // Проверяем, существует ли пост
    await this.findOrNotFoundFail(postId);
    
    // Ищем существующий лайк
    const existingLike = await this.postLikesRepository.findOne({
      where: { postId, userId }
    });
    
    if (likeStatus === 'None' && existingLike) {
      // Удаляем оценку, если статус None
      await this.postLikesRepository.remove(existingLike);
      return true;
    }
    
    if (existingLike) {
      // Обновляем существующую оценку
      existingLike.status = likeStatus;
      existingLike.addedAt = new Date();
      await this.postLikesRepository.save(existingLike);
    } else if (likeStatus !== 'None') {
      // Создаем новую оценку
      const newLike = PostTypeOrmFactory.createPostLike(postId, userId, userLogin, likeStatus);
      await this.postLikesRepository.save(newLike);
    }
    
    return true;
  }

  async findPostsByBlogId(blogId: string): Promise<PostTypeOrm[]> {
    return await this.postsRepository.find({
      where: { blogId },
      relations: ['blog']
    });
  }
} 