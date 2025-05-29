import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersTypeOrmService } from './users-typeorm.service';
import { SessionTypeOrmService } from './session-typeorm.service';
import { CryptoService } from './crypto.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import * as crypto from 'node:crypto';
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
import { UserContextDto } from '../guards/dto/user-context.dto';
import {
  BadRequestDomainException,
  UnauthorizedDomainException,
} from 'src/core/exceptions/domain-exceptions';

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

  async validateUser(
    login: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersTypeOrmService.findByLogin(login);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      return null;
    }
    return { id: user.id.toString() };
  }

  async createUser(dto: CreateUserInputDto): Promise<void> {
    // Check if login or email already exists
    const loginExists = await this.usersTypeOrmService.loginIsExist(dto.login);
    if (loginExists) {
      throw BadRequestDomainException.create(
        `Login ${dto.login} is already taken`,
        'login',
      );
    }

    const emailExists = await this.usersTypeOrmService.emailIsExist(dto.email);
    if (emailExists) {
      throw BadRequestDomainException.create(
        `Email ${dto.email} is already taken`,
        'email',
      );
    }

    // Generate confirmation code and expiration date
    const confirmationCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000); // 75 minutes

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
      throw BadRequestDomainException.create('Email does not exist', 'email');
    }

    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create(
        'Email already confirmed',
        'email',
      );
    }

    // Generate new confirmation code
    const confirmationCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000); // 75 minutes

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
      throw BadRequestDomainException.create('Code does not exist', 'code');
    }

    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create('Email already confirmed', 'code');
    }

    if (!user.expirationDate || new Date() > user.expirationDate) {
      throw BadRequestDomainException.create(
        'Confirmation code expired',
        'code',
      );
    }

    if (user.confirmationCode !== code) {
      throw BadRequestDomainException.create(
        'Invalid confirmation code',
        'code',
      );
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
    const recoveryCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000); // 75 minutes

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
      throw BadRequestDomainException.create('Code does not exist', 'code');
    }

    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create('Email already confirmed', 'code');
    }

    if (!user.expirationDate || new Date() > user.expirationDate) {
      throw BadRequestDomainException.create(
        'Recovery code expired',
        'code',
      );
    }

    if (user.confirmationCode !== code) {
      throw BadRequestDomainException.create(
        'Invalid confirmation code',
        'code',
      );
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
      throw UnauthorizedDomainException.create(
        'Invalid login or password or email',
        'loginOrEmail'
      );
    }

    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      throw UnauthorizedDomainException.create(
        'Invalid login or password or email',
        'loginOrEmail'
      );
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
      throw UnauthorizedDomainException.create('Refresh token is missing');
    }

    // Add token to blacklist
    await this.refreshTokenRepository.save(oldRefreshToken);

    // Check if session exists and is active
    const sessions = await this.sessionTypeOrmService.getAllActiveDevicesForUser(userId);
    const session = sessions.find((s) => s.deviceId === deviceId);

    if (!session) {
      throw UnauthorizedDomainException.create('Session not found');
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
    try {
      await this.sessionTypeOrmService.updateSessionTokens(deviceId, iat, exp);
    } catch (error) {
      throw UnauthorizedDomainException.create('Failed to update session');
    }

    return { accessToken, refreshToken };
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.sessionTypeOrmService.deleteSessionByUserIdAndDeviceId(userId, deviceId);
  }

  private async generateDeviceId(): Promise<string> {
    return randomUUID();
  }
} 