import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  BadRequestDomainException,
  UnauthorizedDomainException,
} from 'src/core/exceptions/domain-exceptions';
import { EmailService } from 'src/features/notifications/email.service';
import { InjectModel } from '@nestjs/mongoose';
import { SessionService } from './session.service';
import { addSeconds } from 'date-fns';
import { CreateSessionDto } from '../dto/create-session.dto';
import { UpdateSessionDomainDto } from '../domain/dto/update-session.domain.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private sessionService: SessionService,
    private emailService: EmailService,
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
    const deviceId = await this.sessionService.generateDeviceId();

    const iat = new Date(Date.now());
    const refreshTokenSeconds = 20;
    const exp = addSeconds(iat, refreshTokenSeconds);

    const accessToken = this.jwtService.sign({ id: userId } as UserContextDto, {
      secret: 'access-token-secret', //process.env.AC_SECRET || 'your_secret_key'
      expiresIn: '10s',
    });

    const refreshToken = this.jwtService.sign(
      { id: userId } as UserContextDto,
      {
        secret: 'refresh-token-secret',
        expiresIn: '20s',
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

  async refreshTokens(userId: string, deviceId: string) {
    const iat = new Date(Date.now());
    const refreshTokenSeconds = 20;
    const exp = addSeconds(iat, refreshTokenSeconds);

    const accessToken = this.jwtService.sign(
      { id: userId, iat: iat.getTime(), deviceId } as UserContextDto,
      {
        secret: 'access-token-secret', //process.env.AC_SECRET || 'your_secret_key'
        expiresIn: '10s',
      },
    );

    const refreshToken = this.jwtService.sign(
      { id: userId } as UserContextDto,
      {
        secret: 'refresh-token-secret',
        expiresIn: '20s',
      },
    );

    const sessionUpdates: UpdateSessionDomainDto = {
      iat: iat.toISOString(),
      exp,
    };

    await this.sessionService.updateSession(deviceId, sessionUpdates);

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
      );
    }
    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      throw UnauthorizedDomainException.create(
        'Invalid login or password or email',
      );
    }
    return await this.login(user.id, deviceName, ip);
  }

  async createUser(dto: CreateUserDto): Promise<void> {
    // if (await this.usersRepository.emailIsExist(dto.email)) {
    //   throw BadRequestDomainException.create(
    //     `Email ${dto.email} is already taken`,
    //   );
    // }

    // if (await this.usersRepository.loginIsExist(dto.login)) {
    //   throw BadRequestDomainException.create(
    //     `Login ${dto.login} is already taken`,
    //   );
    // }

    if (await this.usersRepository.emailIsExist(dto.email)) {
      throw BadRequestDomainException.create(
        `Email ${dto.email} is already taken`,
        'email', // указание поля, которое вызвало ошибку
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

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      confirmationCode,
      expirationDate,
    });

    await this.emailService.sendConfirmationEmail(dto.email, confirmationCode);
    await this.usersRepository.save(user);
  }

  async resendConfirmationCode(email: string) {
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

    user.confirmationCode = confirmationCode;
    user.expirationDate = expirationDate;

    await this.emailService.sendConfirmationEmail(email, confirmationCode);
    await this.usersRepository.save(user);
  }

  async confirmRegistration(code: string) {
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
    user.isEmailConfirmed = true;
    await this.usersRepository.save(user);
  }

  async passwordRecovery(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw BadRequestDomainException.create('Email does not exist', 'email');
    }
    user.confirmationCode = crypto.randomUUID();
    user.expirationDate = new Date(Date.now() + 75 * 60 * 1000);
    user.isEmailConfirmed = false;

    await this.emailService.sendPasswordRecoveryEmail(
      email,
      user.confirmationCode,
    );
    await this.usersRepository.save(user);
  }

  async confirmPasswordRecovery(newPassword: string, code: string) {
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

    user.passwordHash =
      await this.cryptoService.createPasswordHash(newPassword);
    user.isEmailConfirmed = true;
    await this.usersRepository.save(user);
  }
}
