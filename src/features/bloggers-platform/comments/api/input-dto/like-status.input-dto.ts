import { IsEnum, IsNotEmpty } from 'class-validator';
import { LikeStatus } from 'src/core/dto/likes';

export class LikeStatusInputDto {
  @IsEnum(['None', 'Like', 'Dislike'], { message: 'Invalid like status' })
  @IsNotEmpty()
  likeStatus: LikeStatus;
}
