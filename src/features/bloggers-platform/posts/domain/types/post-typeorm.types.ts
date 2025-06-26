import { LikeStatus } from '../../../../../core/dto/likes';

export interface CreatePostTypeOrmDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export interface UpdatePostTypeOrmDto {
  title?: string;
  shortDescription?: string;
  content?: string;
  blogId?: string;
}

export interface CreatePostForSpecificBlogTypeOrmDto {
  title: string;
  shortDescription: string;
  content: string;
}

export interface PostTypeOrmInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export interface PostLikeTypeOrmInterface {
  id: string;
  postId: string;
  userId: string;
  login: string;
  status: LikeStatus;
  addedAt: Date;
}

export interface ExtendedLikesInfoTypeOrm {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: NewestLikeTypeOrm[];
}

export interface NewestLikeTypeOrm {
  userId: string;
  login: string;
  addedAt: Date;
} 