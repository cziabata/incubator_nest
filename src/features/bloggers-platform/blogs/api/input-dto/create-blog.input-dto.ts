import { Transform } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateBlogInputDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(15)
  name: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
    {
      message: 'websiteUrl must be a valid URL starting with https://',
    },
  )
  @MaxLength(100)
  websiteUrl: string;
}
