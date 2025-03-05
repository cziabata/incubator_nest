import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../application/auth.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async createUser(@Body() body: CreateUserInputDto): Promise<void> {
    await this.authService.createUser(body);
  }
}
