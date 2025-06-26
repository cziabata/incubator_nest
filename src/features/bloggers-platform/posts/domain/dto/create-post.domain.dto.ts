import { LikeStatus } from '../../../../../core/dto/likes';

export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: {
      addedAt: Date;
      userId: string;
      login: string;
    }[];
  };
}
