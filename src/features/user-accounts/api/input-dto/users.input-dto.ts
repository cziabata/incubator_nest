import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserInputDto {
  @IsNotEmpty({ message: 'Login is required' })
  @Length(3, 10, { message: 'Login must be between 3 and 10 characters' })
  login: string;

  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  // @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, {
  //   message: 'Password must contain at least one letter and one number',
  // })
  password: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
