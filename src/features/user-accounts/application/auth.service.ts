import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { BadRequestDomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailService } from 'src/features/notifications/email.service';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { add, isAfter } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
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

  async login(userId: string) {
    const accessToken = this.jwtService.sign({ id: userId } as UserContextDto);
    return {
      accessToken,
    };
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
        'login', // указание поля, которое вызвало ошибку
      );
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const confirmationCode = uuidv4();

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      confirmationCode,
      expirationDate: add(new Date(), { hours: 1, minutes: 15 }),
    });

    await this.emailService.sendConfirmationEmail(dto.email, confirmationCode);

    await this.usersRepository.save(user);
  }

  async resendConfirmationCode(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw BadRequestDomainException.create('User not found', 'user');
    }

    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create('Email already confirmed');
    }

    const confirmationCode = uuidv4();

    user.confirmationCode = confirmationCode;
    user.expirationDate = add(new Date(), { hours: 1, minutes: 15 });

    await this.emailService.sendConfirmationEmail(email, confirmationCode);

    await this.usersRepository.save(user);
  }

  async confirmRegistration(code: string) {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw BadRequestDomainException.create('User not found', 'user');
    }
    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create('Email already confirmed');
    }
    if (
      !user.expirationDate ||
      !isAfter(user.expirationDate, new Date(Date.now()))
    ) {
      throw BadRequestDomainException.create('Confirmation code expired');
    }
    if (user.confirmationCode !== code) {
      throw BadRequestDomainException.create('Invalid confirmation code');
    }
    user.isEmailConfirmed = true;
    await this.usersRepository.save(user);
  }

  async passwordRecovery(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw BadRequestDomainException.create('User not found', 'user');
    }

    const recoveryCode = uuidv4();

    user.confirmationCode = recoveryCode;
    user.expirationDate = add(new Date(), { hours: 1, minutes: 15 });
    user.isEmailConfirmed = false;

    await this.emailService.sendPasswordRecoveryEmail(email, recoveryCode);

    await this.usersRepository.save(user);
  }

  async confirmPasswordRecovery(newPassword: string, code: string) {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw BadRequestDomainException.create('User not found', 'user');
    }
    if (user.isEmailConfirmed) {
      throw BadRequestDomainException.create('Email already confirmed');
    }
    if (
      !user.expirationDate ||
      !isAfter(user.expirationDate, new Date(Date.now()))
    ) {
      throw BadRequestDomainException.create('Confirmation code expired');
    }
    if (user.confirmationCode !== code) {
      throw BadRequestDomainException.create('Invalid confirmation code');
    }

    user.passwordHash =
      await this.cryptoService.createPasswordHash(newPassword);
    user.isEmailConfirmed = true;

    await this.usersRepository.save(user);
  }
}
