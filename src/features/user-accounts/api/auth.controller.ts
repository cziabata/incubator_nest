import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthService } from '../application/auth.service';
import { Throttle } from '@nestjs/throttler';
import { ResendRegistrationEmailInputDto } from './input-dto/resend-registration-email.input-dto';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { ConfirmPasswordRecoveryInputDto } from './input-dto/confirm-password-recovery.input-dto';
import { LoginInputDto } from './input-dto/login.input-dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { MeViewDto } from './view-dto/users.view-dto';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { Response, Request } from 'express';
import { RefreshTokenGuard } from '../guards/bearer/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

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

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() body: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.toString() ||
      req.socket.remoteAddress ||
      'unknown';
    const deviceName = req.headers['user-agent'] || 'unknown';

    const { accessToken, refreshToken } =
      await this.authService.validateAndLogin(
        body.loginOrEmail,
        body.password,
        deviceName,
        ip,
      );

    // Устанавливаем refreshToken в cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userId = req.user.id;
    const deviceId = req.session?.deviceId as string;
    await this.authService.logout(userId, deviceId);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authQueryRepository.me(user.id);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    // User and session data are now available in the request
    const userId = req.user.id;
    const sessionData = req.user.session;

    // Generate new tokens
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      userId,
      sessionData.deviceId,
    );

    // Set the new refresh token as a cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: 'none', // Adjust according to your needs
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { accessToken };
  }
}
