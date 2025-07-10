import { IsString, IsNotEmpty } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class SubmitAnswerInputDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  answer: string;
} 