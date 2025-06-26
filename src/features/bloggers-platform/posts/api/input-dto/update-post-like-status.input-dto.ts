import { IsEnum, IsNotEmpty } from 'class-validator';
import { LikeStatus } from '../../../../../core/dto/likes';

export class UpdatePostLikeStatusInputDto {
  @IsEnum(['None', 'Like', 'Dislike'], { message: 'Invalid like status' })
  @IsNotEmpty()
  likeStatus: LikeStatus;
}
