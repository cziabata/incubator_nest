import { CommentTypeOrm } from './comment-typeorm.entity';
import { CommentLikeTypeOrm } from './comment-like-typeorm.entity';
import { CreateCommentTypeOrmDto, UpdateCommentTypeOrmDto } from './types/comment-typeorm.types';
import { LikeStatus } from '../../../../core/dto/likes';

export class CommentTypeOrmFactory {
  static createComment(dto: CreateCommentTypeOrmDto): CommentTypeOrm {
    const comment = new CommentTypeOrm();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.userId = dto.userId;
    comment.userLogin = dto.userLogin;
    
    return comment;
  }

  static updateComment(comment: CommentTypeOrm, dto: UpdateCommentTypeOrmDto): CommentTypeOrm {
    if (dto.content !== undefined) comment.content = dto.content;
    
    return comment;
  }

  static createCommentLike(commentId: string, userId: string, status: LikeStatus): CommentLikeTypeOrm {
    const like = new CommentLikeTypeOrm();
    like.commentId = commentId;
    like.userId = userId;
    like.status = status;
    
    return like;
  }
} 