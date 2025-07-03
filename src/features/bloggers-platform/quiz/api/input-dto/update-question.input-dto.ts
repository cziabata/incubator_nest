import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class UpdateQuestionInputDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  body: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  correctAnswers: string[];

}