import { CommentDocument } from '../../domain/comment.entity';

export class CommentViewDto {
  id: string;
  content: string;
  createdAt: Date;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };

  static mapToView(comment: CommentDocument, userId?: string): CommentViewDto {
    const status =
      !userId || comment.likes.length === 0
        ? 'None'
        : (comment.likes.find((l) => l.userId === userId)?.status ?? 'None');

    const dto = new CommentViewDto();
    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesInfo.likesCount,
      dislikesCount: comment.likesInfo.dislikesCount,
      myStatus: status,
    };
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    return dto;
  }
}
