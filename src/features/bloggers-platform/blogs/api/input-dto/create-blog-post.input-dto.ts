import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePostForSpecificBlogInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
