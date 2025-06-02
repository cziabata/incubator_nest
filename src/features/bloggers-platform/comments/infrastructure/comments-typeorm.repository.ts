import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentTypeOrm } from '../domain/comment-typeorm.entity';
import { CommentLikeTypeOrm } from '../domain/comment-like-typeorm.entity';
import { CreateCommentTypeOrmDto, UpdateCommentTypeOrmDto } from '../domain/types/comment-typeorm.types';
import { CommentTypeOrmFactory } from '../domain/comment-typeorm.factory';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class CommentsTypeOrmRepository {
  constructor(
    @InjectRepository(CommentTypeOrm)
    private commentsRepository: Repository<CommentTypeOrm>,
    @InjectRepository(CommentLikeTypeOrm)
    private commentLikesRepository: Repository<CommentLikeTypeOrm>
  ) {}

  async findById(id: string): Promise<CommentTypeOrm | null> {
    return await this.commentsRepository.findOne({ 
      where: { id },
      relations: ['post']
    });
  }

  async findOrNotFoundFail(id: string): Promise<CommentTypeOrm> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async create(dto: CreateCommentTypeOrmDto): Promise<CommentTypeOrm> {
    const comment = CommentTypeOrmFactory.createComment(dto);
    return await this.commentsRepository.save(comment);
  }

  async update(id: string, dto: UpdateCommentTypeOrmDto): Promise<void> {
    const comment = await this.findOrNotFoundFail(id);
    const updatedComment = CommentTypeOrmFactory.updateComment(comment, dto);
    await this.commentsRepository.save(updatedComment);
  }

  async deleteById(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
    await this.commentsRepository.delete({ id });
  }

  async save(comment: CommentTypeOrm): Promise<CommentTypeOrm> {
    return await this.commentsRepository.save(comment);
  }

  async updateLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<boolean> {
    // Проверяем, существует ли комментарий
    await this.findOrNotFoundFail(commentId);
    
    // Ищем существующий лайк
    const existingLike = await this.commentLikesRepository.findOne({
      where: { commentId, userId }
    });
    
    if (likeStatus === 'None' && existingLike) {
      // Удаляем оценку, если статус None
      await this.commentLikesRepository.remove(existingLike);
      return true;
    }
    
    if (existingLike) {
      // Обновляем существующую оценку
      existingLike.status = likeStatus;
      existingLike.createdAt = new Date();
      await this.commentLikesRepository.save(existingLike);
    } else if (likeStatus !== 'None') {
      // Создаем новую оценку
      const newLike = CommentTypeOrmFactory.createCommentLike(commentId, userId, likeStatus);
      await this.commentLikesRepository.save(newLike);
    }
    
    return true;
  }

  async findCommentsByPostId(postId: string): Promise<CommentTypeOrm[]> {
    return await this.commentsRepository.find({
      where: { postId },
      relations: ['post']
    });
  }
} 