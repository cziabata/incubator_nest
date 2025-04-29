import { ApiProperty } from '@nestjs/swagger';
import { PostDocument } from '../../domain/post.entity';

export class LikeDetailsViewDto {
  @ApiProperty({ description: 'ID пользователя, который поставил лайк' })
  userId: string;

  @ApiProperty({ description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ description: 'Дата добавления лайка' })
  addedAt: Date;
}

export class ExtendedLikesInfoViewDto {
  @ApiProperty({ description: 'Количество лайков' })
  likesCount: number;

  @ApiProperty({ description: 'Количество дизлайков' })
  dislikesCount: number;

  @ApiProperty({
    description: 'Статус лайка текущего пользователя',
    enum: ['None', 'Like', 'Dislike'],
  })
  myStatus: string;

  @ApiProperty({
    description: 'Информация о последних лайках',
    type: [LikeDetailsViewDto],
  })
  newestLikes: LikeDetailsViewDto[];
}

export class PostViewDto {
  @ApiProperty({ description: 'ID поста' })
  id: string;

  @ApiProperty({ description: 'Заголовок поста' })
  title: string;

  @ApiProperty({ description: 'Краткое описание' })
  shortDescription: string;

  @ApiProperty({ description: 'Содержание поста' })
  content: string;

  @ApiProperty({ description: 'ID блога' })
  blogId: string;

  @ApiProperty({ description: 'Название блога' })
  blogName: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Расширенная информация о лайках' })
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  static mapToView(post: any, userId?: string): PostViewDto {
    const dto = new PostViewDto();
    dto.id = post.id?.toString();
    dto.title = post.title;
    dto.shortDescription = post.short_description;
    dto.content = post.content;
    dto.blogId = post.blog_id?.toString();
    dto.blogName = post.blog_name || '';
    dto.createdAt = post.created_at;
    dto.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };
    return dto;
  }
}
