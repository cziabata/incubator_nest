import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimTransform } from '../../../../core/decorators/transform/trim';

export class SubmitAnswerInputDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trimTransform)
  answer: string;
} 