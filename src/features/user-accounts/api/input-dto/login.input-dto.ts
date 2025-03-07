import { IsNotEmpty } from 'class-validator';

export class LoginInputDto {
  @IsNotEmpty({ message: 'Login or email is required' })
  loginOrEmail: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
