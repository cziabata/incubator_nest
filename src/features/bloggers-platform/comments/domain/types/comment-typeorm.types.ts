import { LikeStatus } from '../../../../../core/dto/likes';

export interface CreateCommentTypeOrmDto {
  content: string;
  postId: string;
  userId: string;
  userLogin: string;
}

export interface UpdateCommentTypeOrmDto {
  content?: string;
}

export interface CommentTypeOrmInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  postId: string;
  userId: string;
  userLogin: string;
}

export interface CommentLikeTypeOrmInterface {
  id: string;
  commentId: string;
  userId: string;
  status: LikeStatus;
  createdAt: Date;
}

export interface CommentLikesInfoTypeOrm {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export interface CommentatorInfoTypeOrm {
  userId: string;
  userLogin: string;
} 