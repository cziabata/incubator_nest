import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentTypeOrm } from '../../domain/comment-typeorm.entity';
import { CommentLikeTypeOrm } from '../../domain/comment-like-typeorm.entity';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CommentLikesInfoTypeOrm, CommentatorInfoTypeOrm } from '../../domain/types/comment-typeorm.types';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class CommentsTypeOrmQueryRepository {
  constructor(
    @InjectRepository(CommentTypeOrm)
    private commentsRepository: Repository<CommentTypeOrm>,
    @InjectRepository(CommentLikeTypeOrm)
    private commentLikesRepository: Repository<CommentLikeTypeOrm>
  ) {}

  async getById(id: string, userId?: string): Promise<CommentViewDto> {
    const comment = await this.commentsRepository.findOne({
      where: { id }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const likesInfo = await this.getLikesInfo(id, userId);
    const commentatorInfo = this.getCommentatorInfo(comment);
    
    return this.mapToView(comment, likesInfo, commentatorInfo);
  }

  async getCommentsByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const queryBuilder = this.commentsRepository.createQueryBuilder('comment')
      .where('comment.postId = :postId', { postId });

    // Apply sorting
    const sortByMap: Record<string, string> = {
      createdAt: 'comment.createdAt',
      content: 'comment.content',
    };
    const sortBy = sortByMap[query.sortBy] || 'comment.createdAt';
    queryBuilder.orderBy(sortBy, query.sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const comments = await queryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    // Get likes info for all comments
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likesInfo = await this.getLikesInfo(comment.id, userId);
        const commentatorInfo = this.getCommentatorInfo(comment);
        return this.mapToView(comment, likesInfo, commentatorInfo);
      })
    );

    return PaginatedViewDto.mapToView({
      items: commentsWithLikes,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private async getLikesInfo(commentId: string, userId?: string): Promise<CommentLikesInfoTypeOrm> {
    // Get likes and dislikes count
    const likesCount = await this.commentLikesRepository.count({
      where: { commentId, status: 'Like' }
    });
    
    const dislikesCount = await this.commentLikesRepository.count({
      where: { commentId, status: 'Dislike' }
    });

    // Get user's status
    let myStatus: LikeStatus = 'None';
    if (userId) {
      const userLike = await this.commentLikesRepository.findOne({
        where: { commentId, userId }
      });
      myStatus = userLike?.status || 'None';
    }

    return {
      likesCount,
      dislikesCount,
      myStatus
    };
  }

  private getCommentatorInfo(comment: CommentTypeOrm): CommentatorInfoTypeOrm {
    return {
      userId: comment.userId,
      userLogin: comment.userLogin
    };
  }

  private mapToView(
    comment: CommentTypeOrm, 
    likesInfo: CommentLikesInfoTypeOrm,
    commentatorInfo: CommentatorInfoTypeOrm
  ): CommentViewDto {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: likesInfo.likesCount,
        dislikesCount: likesInfo.dislikesCount,
        myStatus: likesInfo.myStatus
      },
      commentatorInfo: {
        userId: commentatorInfo.userId,
        userLogin: commentatorInfo.userLogin
      }
    };
  }
} 