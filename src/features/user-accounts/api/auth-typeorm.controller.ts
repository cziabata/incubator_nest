import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { AuthTypeOrmService } from '../application/auth-typeorm.service';
import { Throttle } from '@nestjs/throttler';
import { ResendRegistrationEmailInputDto } from './input-dto/resend-registration-email.input-dto';
import { ConfirmRegistrationInputDto } from './input-dto/confirm-registration.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { ConfirmPasswordRecoveryInputDto } from './input-dto/confirm-password-recovery.input-dto';
import { LoginInputDto } from './input-dto/login.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { MeViewDto } from './view-dto/users.view-dto';
import { AuthTypeOrmQueryRepository } from '../infrastructure/query/auth-typeorm.query-repository';
import { Response, Request } from 'express';
import { RefreshTokenTypeOrmGuard } from '../guards/bearer/refresh-token-typeorm.guard';

@Controller('auth-typeorm')
export class AuthTypeOrmController {
  constructor(
    private authTypeOrmService: AuthTypeOrmService,
    private authTypeOrmQueryRepository: AuthTypeOrmQueryRepository,
  ) {}

  @Post('registration')
  // @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async createUser(@Body() body: CreateUserInputDto): Promise<void> {
    await this.authTypeOrmService.createUser(body);
  }

  @Post('registration-email-resending')
  // @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async resendConfirmationCode(
    @Body() body: ResendRegistrationEmailInputDto,
  ): Promise<void> {
    await this.authTypeOrmService.resendConfirmationCode(body.email);
  }

  @Post('registration-confirmation')
  // @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async confirmRegistration(
    @Body() body: ConfirmRegistrationInputDto,
  ): Promise<void> {
    await this.authTypeOrmService.confirmRegistration(body.code);
  }

  @Post('password-recovery')
  // @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async passwordRecovery(
    @Body() body: PasswordRecoveryInputDto,
  ): Promise<void> {
    await this.authTypeOrmService.passwordRecovery(body.email);
  }

  @Post('new-password')
  // @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(204)
  async confirmPasswordRecovery(
    @Body() body: ConfirmPasswordRecoveryInputDto,
  ): Promise<void> {
    await this.authTypeOrmService.confirmPasswordRecovery(body.password, body.code);
  }

  @Post('login')
  //  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @HttpCode(200)
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
      await this.authTypeOrmService.validateAndLogin(
        body.loginOrEmail,
        body.password,
        deviceName,
        ip,
      );

    // Set refreshToken in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Always set secure to true for test passing
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { accessToken };
  }

  @UseGuards(RefreshTokenTypeOrmGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!req.user || !req.user.id || !req.user.session?.deviceId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.user.id;
    const deviceId = req.user.session.deviceId;

    await this.authTypeOrmService.logout(userId, deviceId);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authTypeOrmQueryRepository.me(user.id);
  }

  @UseGuards(RefreshTokenTypeOrmGuard)
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user || !req.user.id || !req.user.session?.deviceId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // User and session data are now available in the request
    const userId = req.user.id;
    const sessionData = req.user.session;
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await this.authTypeOrmService.refreshTokens(
      userId,
      sessionData.deviceId,
      oldRefreshToken,
    );

    // Set the new refresh token as a cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Always set secure to true for test passing
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
} 