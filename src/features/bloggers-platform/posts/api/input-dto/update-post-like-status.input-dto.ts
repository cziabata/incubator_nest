import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LikeStatus } from 'src/core/dto/likes';

export class UpdatePostLikeStatusInputDto {
  @ApiProperty({
    description: 'Статус лайка',
    enum: ['None', 'Like', 'Dislike'],
    example: 'Like',
  })
  @IsEnum(['None', 'Like', 'Dislike'], { message: 'Invalid like status' })
  @IsNotEmpty()
  likeStatus: LikeStatus;
} 