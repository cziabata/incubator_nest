import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UsersTypeOrmRepository } from '../infrastructure/users-typeorm.repository';
import { CryptoService } from './crypto.service';
import { UserTypeOrmFactory } from '../domain/user-typeorm.factory';
import {
  CreateUserTypeOrmDto,
  CreateUserWithConfirmationTypeOrmDto,
  UpdateUserTypeOrmDto,
} from '../domain/types/user-typeorm.types';

@Injectable()
export class UsersTypeOrmService {
  constructor(
    private usersTypeOrmRepository: UsersTypeOrmRepository,
    private cryptoService: CryptoService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    // Check if login or email already exists
    const loginExists = await this.usersTypeOrmRepository.loginIsExist(dto.login);
    if (loginExists) {
      throw new Error('Login already exists');
    }

    const emailExists = await this.usersTypeOrmRepository.emailIsExist(dto.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const passwordHash = await this.cryptoService.createPasswordHash(dto.password);

    const createUserDto: CreateUserTypeOrmDto = {
      login: dto.login,
      email: dto.email,
      passwordHash: passwordHash,
      isEmailConfirmed: false,
      firstName: undefined,
      lastName: undefined,
    };

    return this.usersTypeOrmRepository.createUser(createUserDto);
  }

  async createUserWithConfirmation(dto: {
    login: string;
    email: string;
    password: string;
    confirmationCode: string;
    expirationDate: Date;
    firstName?: string;
    lastName?: string;
  }): Promise<string> {
    // Check if login or email already exists
    const loginExists = await this.usersTypeOrmRepository.loginIsExist(dto.login);
    if (loginExists) {
      throw new Error('Login already exists');
    }

    const emailExists = await this.usersTypeOrmRepository.emailIsExist(dto.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const passwordHash = await this.cryptoService.createPasswordHash(dto.password);

    const createUserDto: CreateUserWithConfirmationTypeOrmDto = {
      login: dto.login,
      email: dto.email,
      passwordHash: passwordHash,
      confirmationCode: dto.confirmationCode,
      expirationDate: dto.expirationDate,
      isEmailConfirmed: false,
      firstName: dto.firstName || undefined,
      lastName: dto.lastName || undefined,
    };

    return this.usersTypeOrmRepository.createUserWithConfirmation(createUserDto);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    // Check if user exists
    const existingUser = await this.usersTypeOrmRepository.findByIdOrNotFoundFail(id);

    // Check if email is changing and if new email already exists
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.usersTypeOrmRepository.emailIsExist(dto.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    const updateUserDto: UpdateUserTypeOrmDto = {
      email: dto.email,
    };

    await this.usersTypeOrmRepository.updateUser(id, updateUserDto);
    return id;
  }

  async deleteUser(id: string): Promise<void> {
    await this.usersTypeOrmRepository.softDeleteUser(id);
  }

  async confirmEmail(userId: string): Promise<void> {
    await this.usersTypeOrmRepository.confirmEmail(userId);
  }

  async updateConfirmationCode(
    userId: string,
    confirmationCode: string,
    expirationDate: Date,
  ): Promise<void> {
    await this.usersTypeOrmRepository.updateConfirmationCode(userId, {
      confirmationCode,
      expirationDate,
    });
  }

  async updateConfirmationCodeAndResetConfirmation(
    userId: string,
    confirmationCode: string,
    expirationDate: Date,
  ): Promise<void> {
    await this.usersTypeOrmRepository.updateConfirmationCodeAndResetConfirmation(userId, {
      confirmationCode,
      expirationDate,
    });
  }

  async updatePasswordAndConfirmEmail(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const passwordHash = await this.cryptoService.createPasswordHash(newPassword);
    await this.usersTypeOrmRepository.updatePasswordAndConfirmEmail(userId, passwordHash);
  }

  async findByLogin(login: string) {
    return this.usersTypeOrmRepository.findByLogin(login);
  }

  async findByEmail(email: string) {
    return this.usersTypeOrmRepository.findByEmail(email);
  }

  async findByLoginOrEmail(loginOrEmail: string) {
    return this.usersTypeOrmRepository.findByLoginOrEmail(loginOrEmail);
  }

  async findByConfirmationCode(confirmationCode: string) {
    return this.usersTypeOrmRepository.findByConfirmationCode(confirmationCode);
  }

  async findById(id: string) {
    return this.usersTypeOrmRepository.findById(id);
  }

  async loginIsExist(login: string): Promise<boolean> {
    return this.usersTypeOrmRepository.loginIsExist(login);
  }

  async emailIsExist(email: string): Promise<boolean> {
    return this.usersTypeOrmRepository.emailIsExist(email);
  }
} 