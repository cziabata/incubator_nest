import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @HttpCode(204)
  async createUser(@Body() body: CreateUserInputDto): Promise<void> {
    await this.authService.createUser(body);
  }
}
