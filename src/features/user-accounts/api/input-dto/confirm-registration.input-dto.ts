import { IsNotEmpty } from 'class-validator';

export class ConfirmRegistrationInputDto {
  @IsNotEmpty({ message: 'Code is required' })
  code: string;
}
