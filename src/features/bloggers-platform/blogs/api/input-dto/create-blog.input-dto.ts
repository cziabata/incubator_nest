import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBlogInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  description: string;

  @IsString()
  @IsUrl()
  @MaxLength(100)
  websiteUrl: string;
}
