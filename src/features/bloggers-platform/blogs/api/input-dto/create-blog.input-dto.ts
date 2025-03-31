import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBlogInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(15)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsString()
  @Matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/, {
    message: 'websiteUrl must be a valid URL starting with https://',
  })
  @MaxLength(100)
  websiteUrl: string;
}
