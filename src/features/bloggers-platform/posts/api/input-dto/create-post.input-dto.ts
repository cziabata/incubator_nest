import { IsString, MaxLength, IsNotEmpty, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostInputDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(30, { message: 'Title must be less than 30 characters' })
  title: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(100, {
    message: 'Short description must be less than 100 characters',
  })
  shortDescription: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must be less than 1000 characters' })
  content: string;

  @IsMongoId({ message: 'Invalid blog ID format' })
  @IsNotEmpty({ message: 'Blog ID is required' })
  blogId: string;
}
