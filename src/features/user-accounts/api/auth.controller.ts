import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../application/auth.service';
import { Throttle } from '@nestjs/throttler';
import { ResendRegistrationEmailInputDto } from './input-dto/resend-registration-email.input-dto';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { ConfirmPasswordRecoveryInputDto } from './input-dto/confirm-password-recovery.input-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async createUser(@Body() body: CreateUserInputDto): Promise<void> {
    await this.authService.createUser(body);
  }

  @Post('registration-email-resending')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async resendConfirmationCode(
    @Body() body: ResendRegistrationEmailInputDto,
  ): Promise<void> {
    await this.authService.resendConfirmationCode(body.email);
  }

  @Post('registration-confirmation')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async confirmRegistration(
    @Body() body: ConfirmRegistrationInputDto,
  ): Promise<void> {
    await this.authService.confirmRegistration(body.code);
  }

  @Post('password-recovery')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async passwordRecovery(
    @Body() body: PasswordRecoveryInputDto,
  ): Promise<void> {
    await this.authService.passwordRecovery(body.email);
  }

  @Post('new-password')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async confirmPasswordRecovery(
    @Body() body: ConfirmPasswordRecoveryInputDto,
  ): Promise<void> {
    await this.authService.confirmPasswordRecovery(body.password, body.code);
  }
}
