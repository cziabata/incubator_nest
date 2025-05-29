import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersTypeOrmService } from './users-typeorm.service';
import { SessionTypeOrmService } from './session-typeorm.service';
import { CryptoService } from './crypto.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { addSeconds } from 'date-fns';
import {
  CreateUserTypeOrmDto,
  CreateUserWithConfirmationTypeOrmDto,
} from '../domain/types/user-typeorm.types';
import {
  CreateSessionTypeOrmDto,
  AuthTokensDto,
  CreateTokensDto,
  RefreshTokensDto,
} from '../domain/types/session-typeorm.types';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';
import { EmailService } from '../../../features/notifications/email.service';
import { BlacklistedRefreshTokenTypeOrmRepository } from '../infrastructure/blacklisted-refresh-token-typeorm.repository';

// Constants matching original AuthService
const REFRESH_TOKEN_SECONDS = 1800; // 30 minutes
const ACCESS_EXPIRES_IN = '60m'; // 60 minutes
const REFRESH_EXPIRES_IN = '60m'; // 60 minutes

@Injectable()
export class AuthTypeOrmService {
  constructor(
    private usersTypeOrmService: UsersTypeOrmService,
    private sessionTypeOrmService: SessionTypeOrmService,
    private cryptoService: CryptoService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly refreshTokenRepository: BlacklistedRefreshTokenTypeOrmRepository,
  ) {}

  async createUser(dto: CreateUserInputDto): Promise<void> {
    // Check if login or email already exists
    const loginExists = await this.usersTypeOrmService.loginIsExist(dto.login);
    if (loginExists) {
      throw new BadRequestException([
        { message: `Login ${dto.login} is already taken`, field: 'login' },
      ]);
    }

    const emailExists = await this.usersTypeOrmService.emailIsExist(dto.email);
    if (emailExists) {
      throw new BadRequestException([
        { message: `Email ${dto.email} is already taken`, field: 'email' },
      ]);
    }

    // Generate confirmation code and expiration date
    const confirmationCode = randomUUID();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1); // 1 hour expiration

    // Create user with confirmation
    const userId = await this.usersTypeOrmService.createUserWithConfirmation({
      login: dto.login,
      email: dto.email,
      password: dto.password,
      confirmationCode,
      expirationDate,
    });

    // Send confirmation email
    await this.emailService.sendConfirmationEmail(dto.email, confirmationCode);
  }

  async resendConfirmationCode(email: string): Promise<void> {
    const user = await this.usersTypeOrmService.findByEmail(email);
    if (!user) {
      throw new BadRequestException([
        { message: 'Email not found', field: 'email' },
      ]);
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException([
        { message: 'Email already confirmed', field: 'email' },
      ]);
    }

    // Generate new confirmation code
    const confirmationCode = randomUUID();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1); // 1 hour expiration

    await this.usersTypeOrmService.updateConfirmationCodeAndResetConfirmation(
      user.id,
      confirmationCode,
      expirationDate,
    );

    // Send confirmation email
    await this.emailService.sendConfirmationEmail(email, confirmationCode);
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersTypeOrmService.findByConfirmationCode(code);
    if (!user) {
      throw new BadRequestException([
        { message: 'Invalid confirmation code', field: 'code' },
      ]);
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException([
        { message: 'Email already confirmed', field: 'code' },
      ]);
    }

    if (user.isEmailConfirmationExpired()) {
      throw new BadRequestException([
        { message: 'Confirmation code expired', field: 'code' },
      ]);
    }

    await this.usersTypeOrmService.confirmEmail(user.id);
  }

  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersTypeOrmService.findByEmail(email);
    if (!user) {
      // Do not reveal that email doesn't exist
      return;
    }

    // Generate recovery code
    const recoveryCode = randomUUID();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1); // 1 hour expiration

    await this.usersTypeOrmService.updateConfirmationCode(
      user.id,
      recoveryCode,
      expirationDate,
    );

    // Send recovery email
    await this.emailService.sendPasswordRecoveryEmail(email, recoveryCode);
  }

  async confirmPasswordRecovery(password: string, code: string): Promise<void> {
    const user = await this.usersTypeOrmService.findByConfirmationCode(code);
    if (!user) {
      throw new BadRequestException([
        { message: 'Invalid recovery code', field: 'code' },
      ]);
    }

    if (user.isEmailConfirmationExpired()) {
      throw new BadRequestException([
        { message: 'Recovery code expired', field: 'code' },
      ]);
    }

    await this.usersTypeOrmService.updatePasswordAndConfirmEmail(user.id, password);
  }

  async validateAndLogin(
    loginOrEmail: string,
    password: string,
    deviceName: string,
    ip: string,
  ): Promise<AuthTokensDto> {
    const user = await this.usersTypeOrmService.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid login or password or email');
    }

    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login or password or email');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Email not confirmed');
    }

    return this.login(user.id, deviceName, ip);
  }

  async login(userId: string, deviceName: string, ip: string): Promise<AuthTokensDto> {
    // Check for existing session with same device name
    const existingSessions = await this.sessionTypeOrmService.getAllActiveDevicesForUser(userId);
    const existingSession = existingSessions.find(
      (session) => session.deviceName === deviceName,
    );

    let deviceId: string;
    if (existingSession) {
      deviceId = existingSession.deviceId;
    } else {
      deviceId = await this.generateDeviceId();
    }

    const iat = new Date(Date.now());
    const exp = addSeconds(iat, REFRESH_TOKEN_SECONDS);

    const accessToken = this.jwtService.sign(
      { id: userId },
      {
        secret: 'access-token-secret',
        expiresIn: ACCESS_EXPIRES_IN,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        id: userId,
        deviceId: deviceId,
        iat: Math.floor(iat.getTime() / 1000),
      },
      {
        secret: 'refresh-token-secret',
        expiresIn: REFRESH_EXPIRES_IN,
      },
    );

    // Create session in database
    const createSessionDto: CreateSessionTypeOrmDto = {
      userId: userId,
      deviceId: deviceId,
      deviceName: deviceName,
      ip: ip,
      iat: iat,
      exp: exp,
    };

    await this.sessionTypeOrmService.createSession(createSessionDto);

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    userId: string,
    deviceId: string,
    oldRefreshToken: string,
  ): Promise<AuthTokensDto> {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    // Add token to blacklist
    await this.refreshTokenRepository.save(oldRefreshToken);

    // Check if session exists and is active
    const sessions = await this.sessionTypeOrmService.getAllActiveDevicesForUser(userId);
    const session = sessions.find((s) => s.deviceId === deviceId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const iat = new Date(Date.now());
    const exp = addSeconds(iat, REFRESH_TOKEN_SECONDS);

    const accessToken = this.jwtService.sign(
      { id: userId },
      {
        secret: 'access-token-secret',
        expiresIn: ACCESS_EXPIRES_IN,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        id: userId,
        deviceId: deviceId,
        iat: Math.floor(iat.getTime() / 1000),
      },
      {
        secret: 'refresh-token-secret',
        expiresIn: REFRESH_EXPIRES_IN,
      },
    );

    // Update session with new timestamps
    await this.sessionTypeOrmService.updateSessionTokens(deviceId, iat, exp);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.sessionTypeOrmService.deleteSessionByUserIdAndDeviceId(userId, deviceId);
  }

  private async generateDeviceId(): Promise<string> {
    return randomUUID();
  }
} 