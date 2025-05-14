import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateCommentInputDto {
  @IsString()
  @IsNotEmpty()
  @Length(20, 300, {
    message: 'Content length should be from 20 to 300 symbols',
  })
  content: string;
} 