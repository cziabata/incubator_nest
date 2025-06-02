import { Injectable } from '@nestjs/common';
import { CommentsTypeOrmRepository } from '../infrastructure/comments-typeorm.repository';
import { PostsTypeOrmService } from '../../posts/application/posts-typeorm.service';
import { CreateCommentTypeOrmDto, UpdateCommentTypeOrmDto } from '../domain/types/comment-typeorm.types';
import { CommentTypeOrm } from '../domain/comment-typeorm.entity';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class CommentsTypeOrmService {
  constructor(
    private commentsRepository: CommentsTypeOrmRepository,
    private postsService: PostsTypeOrmService
  ) {}

  async createComment(dto: CreateCommentTypeOrmDto): Promise<CommentTypeOrm> {
    // Проверяем существование поста
    await this.postsService.getPostById(dto.postId);
    return await this.commentsRepository.create(dto);
  }

  async updateComment(id: string, dto: UpdateCommentTypeOrmDto): Promise<void> {
    await this.commentsRepository.update(id, dto);
  }

  async deleteComment(id: string): Promise<void> {
    await this.commentsRepository.deleteById(id);
  }

  async getCommentById(id: string): Promise<CommentTypeOrm> {
    return await this.commentsRepository.findOrNotFoundFail(id);
  }

  async updateCommentLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus
  ): Promise<boolean> {
    return await this.commentsRepository.updateLikeStatus(commentId, userId, likeStatus);
  }

  async getCommentsByPostId(postId: string): Promise<CommentTypeOrm[]> {
    // Проверяем существование поста
    await this.postsService.getPostById(postId);
    return await this.commentsRepository.findCommentsByPostId(postId);
  }
} 