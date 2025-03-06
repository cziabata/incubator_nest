import { IsNotEmpty, Length } from 'class-validator';

export class ConfirmPasswordRecoveryInputDto {
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  // @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, {
  //   message: 'Password must contain at least one letter and one number',
  // })
  password: string;
}
