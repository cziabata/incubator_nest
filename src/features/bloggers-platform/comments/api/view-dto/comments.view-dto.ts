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

  static mapToView(comment: CommentDocument): CommentViewDto {
    const dto = new CommentViewDto();
    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesInfo.likesCount,
      dislikesCount: comment.likesInfo.dislikesCount,
      myStatus: comment.likesInfo.myStatus,
    };
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    return dto;
  }
}
