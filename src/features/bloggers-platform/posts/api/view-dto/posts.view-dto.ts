export class LikeDetailsViewDto {
  userId: string;

  login: string;

  addedAt: Date;
}

export class ExtendedLikesInfoViewDto {
  likesCount: number;

  dislikesCount: number;

  myStatus: string;

  newestLikes: LikeDetailsViewDto[];
}

export class PostViewDto {
  id: string;

  title: string;

  shortDescription: string;

  content: string;

  blogId: string;

  blogName: string;

  createdAt: Date;

  extendedLikesInfo: ExtendedLikesInfoViewDto;
}
