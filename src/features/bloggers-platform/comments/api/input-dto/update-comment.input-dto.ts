import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentInputDto {
  @ApiProperty({
    description: 'Текст комментария',
    minLength: 20,
    maxLength: 300,
    example: 'Это очень интересный и познавательный комментарий',
  })
  @IsString()
  @IsNotEmpty()
  @Length(20, 300, {
    message: 'Content length should be from 20 to 300 symbols',
  })
  content: string;
} 