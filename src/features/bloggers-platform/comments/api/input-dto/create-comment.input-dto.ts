import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCommentInputDto {
  @ApiProperty({
    description: 'Content of the comment',
    minLength: 20,
    maxLength: 300,
  })
  @IsString()
  @Length(20, 300, { message: 'Content length should be from 20 to 300 symbols' })
  content: string;
} 