import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  BadRequestDomainException,
  UnauthorizedDomainException,
} from 'src/core/exceptions/domain-exceptions';
import { EmailService } from 'src/features/notifications/email.service';
import { SessionService } from './session.service';
import { addSeconds } from 'date-fns';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDomainDto } from '../domain/dto/update-session.domain.dto';
import { BlacklistedRefreshTokenRepository } from '../infrastructure/blacklisted-refresh-token.repository';

// TO DO
const REFRESH_TOKEN_SECONDS = 20; // 20 || 1800
const ACCESS_EXPIRES_IN = '10s'; // "10s" || '60m'
const REFRESH_EXPIRES_IN = '20s'; // "20s" || || '60m'

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private sessionService: SessionService,
    private emailService: EmailService,
    private readonly refreshTokenRepository: BlacklistedRefreshTokenRepository,
  ) {}

  async validateUser(
    login: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLogin(login);
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

  async login(userId: string, deviceName: string, ip: string) {
    // Check for existing session with same device name
    const existingSessions =
      await this.sessionService.getAllActiveSessions(userId);
    const existingSession = existingSessions.find(
      (session) => session.title === deviceName,
    );

    let deviceId;
    if (existingSession) {
      deviceId = existingSession.deviceId;
    } else {
      deviceId = await this.sessionService.generateDeviceId();
    }

    const iat = new Date(Date.now());
    const exp = addSeconds(iat, REFRESH_TOKEN_SECONDS);

    const accessToken = this.jwtService.sign({ id: userId } as UserContextDto, {
      secret: 'access-token-secret',
      expiresIn: ACCESS_EXPIRES_IN,
    });

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

    const newSession: CreateSessionDto = {
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      ip,
      iat: iat.toISOString(),
      exp,
    };

    await this.sessionService.createSession(newSession);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, deviceId: string) {
    await this.sessionService.deleteActiveSessionById(deviceId, userId);
  }

  async refreshTokens(
    userId: string,
    deviceId: string,
    oldRefreshToken: string,
  ) {
    if (!oldRefreshToken) {
      throw UnauthorizedDomainException.create('Refresh token is missing');
    }

    // Добавление токена в черный список
    await this.refreshTokenRepository.save(oldRefreshToken);

    // Проверка существования сессии
    const sessions = await this.sessionService.getAllActiveSessions(userId);
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

    const sessionUpdates: UpdateSessionDomainDto = {
      iat: iat.toISOString(),
      exp,
    };

    try {
      await this.sessionService.updateSession(deviceId, sessionUpdates);
    } catch (error) {
      throw UnauthorizedDomainException.create('Failed to update session');
    }

    return { accessToken, refreshToken };
  }

  async validateAndLogin(
    loginOrEmail: string,
    password: string,
    deviceName: string,
    ip: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
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
    return await this.login(user.id, deviceName, ip);
  }

  async createUser(dto: CreateUserDto): Promise<void> {
    if (await this.usersRepository.emailIsExist(dto.email)) {
      throw BadRequestDomainException.create(
        `Email ${dto.email} is already taken`,
        'email',
      );
    }
    if (await this.usersRepository.loginIsExist(dto.login)) {
      throw BadRequestDomainException.create(
        `Login ${dto.login} is already taken`,
        'login',
      );
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );
    const confirmationCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000);

    // Создаем пользователя с помощью SQL
    this.usersRepository.createUserWithConfirmation({
      login: dto.login,
      email: dto.email,
      passwordHash: passwordHash,
      confirmationCode,
      expirationDate,
      isEmailConfirmed: false
    });

    await this.emailService.sendConfirmationEmail(dto.email, confirmationCode);
  }

  async resendConfirmationCode(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw BadRequestDomainException.create('Email does not exist', 'email');
    }
    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create(
        'Email already confirmed',
        'email',
      );
    }

    const confirmationCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000);

    // Обновляем код подтверждения
    this.usersRepository.updateConfirmationCode(
      user.id,
      confirmationCode,
      expirationDate
    );

    await this.emailService.sendConfirmationEmail(email, confirmationCode);
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
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
    
    // Подтверждаем email
    await this.usersRepository.confirmEmail(user.id);
  }

  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw BadRequestDomainException.create('Email does not exist', 'email');
    }
    
    const confirmationCode = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 75 * 60 * 1000);
    
    // Обновляем код подтверждения и сбрасываем статус подтверждения email
    await this.usersRepository.updateConfirmationCodeAndResetConfirmation(
      user.id,
      confirmationCode,
      expirationDate
    );

    await this.emailService.sendPasswordRecoveryEmail(
      email,
      confirmationCode
    );
  }

  async confirmPasswordRecovery(newPassword: string, code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
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

    const passwordHash = await this.cryptoService.createPasswordHash(newPassword);
    
    // Обновляем пароль и подтверждаем email
    await this.usersRepository.updatePasswordAndConfirmEmail(
      user.id,
      passwordHash
    );
  }
}
