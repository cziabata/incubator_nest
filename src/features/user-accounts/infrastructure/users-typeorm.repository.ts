import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserTypeOrmEntity } from '../domain/user-typeorm.entity';
import {
  CreateUserTypeOrmDto,
  CreateUserWithConfirmationTypeOrmDto,
  UpdateUserTypeOrmDto,
  UpdateConfirmationCodeTypeOrmDto,
  UserFullData,
} from '../domain/types/user-typeorm.types';
import { NotFoundDomainException } from '../../../core/exceptions/domain-exceptions';

@Injectable()
export class UsersTypeOrmRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly usersRepository: Repository<UserTypeOrmEntity>,
  ) {}

  async findById(id: string): Promise<UserTypeOrmEntity | null> {
    return this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdOrNotFoundFail(id: string): Promise<UserTypeOrmEntity> {
    const user = await this.findById(id);

    if (!user) {
      throw NotFoundDomainException.create('user not found');
    }

    return user;
  }

  async findByLogin(login: string): Promise<UserTypeOrmEntity | null> {
    return this.usersRepository.findOne({
      where: { login, deletedAt: IsNull() },
    });
  }

  async findByEmail(email: string): Promise<UserTypeOrmEntity | null> {
    return this.usersRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserTypeOrmEntity | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('(user.login = :loginOrEmail OR user.email = :loginOrEmail)', { loginOrEmail })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async findByConfirmationCode(confirmationCode: string): Promise<UserTypeOrmEntity | null> {
    return this.usersRepository.findOne({
      where: { confirmationCode, deletedAt: IsNull() },
    });
  }

  async loginIsExist(login: string): Promise<boolean> {
    const count = await this.usersRepository.count({
      where: { login, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async emailIsExist(email: string): Promise<boolean> {
    const count = await this.usersRepository.count({
      where: { email, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async createUser(dto: CreateUserTypeOrmDto): Promise<string> {
    const user = this.usersRepository.create({
      login: dto.login,
      email: dto.email,
      passwordHash: dto.passwordHash,
      isEmailConfirmed: dto.isEmailConfirmed ?? false,
      confirmationCode: dto.confirmationCode ?? null,
      expirationDate: dto.expirationDate ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      deletedAt: null,
    });

    const savedUser = await this.usersRepository.save(user);
    return savedUser.id;
  }

  async createUserWithConfirmation(dto: CreateUserWithConfirmationTypeOrmDto): Promise<string> {
    const user = this.usersRepository.create({
      login: dto.login,
      email: dto.email,
      passwordHash: dto.passwordHash,
      confirmationCode: dto.confirmationCode,
      expirationDate: dto.expirationDate,
      isEmailConfirmed: dto.isEmailConfirmed,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      deletedAt: null,
    });

    const savedUser = await this.usersRepository.save(user);
    return savedUser.id;
  }

  async updateUser(id: string, dto: UpdateUserTypeOrmDto): Promise<void> {
    const result = await this.usersRepository.update(
      { id, deletedAt: IsNull() },
      dto,
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async updateConfirmationCode(
    userId: string,
    dto: UpdateConfirmationCodeTypeOrmDto,
  ): Promise<void> {
    const result = await this.usersRepository.update(
      { id: userId, deletedAt: IsNull() },
      {
        confirmationCode: dto.confirmationCode,
        expirationDate: dto.expirationDate,
      },
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async updateConfirmationCodeAndResetConfirmation(
    userId: string,
    dto: UpdateConfirmationCodeTypeOrmDto,
  ): Promise<void> {
    const result = await this.usersRepository.update(
      { id: userId, deletedAt: IsNull() },
      {
        confirmationCode: dto.confirmationCode,
        expirationDate: dto.expirationDate,
        isEmailConfirmed: false,
      },
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async confirmEmail(userId: string): Promise<void> {
    const result = await this.usersRepository.update(
      { id: userId, deletedAt: IsNull() },
      { isEmailConfirmed: true },
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async updatePasswordAndConfirmEmail(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    const result = await this.usersRepository.update(
      { id: userId, deletedAt: IsNull() },
      {
        passwordHash,
        isEmailConfirmed: true,
      },
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async softDeleteUser(id: string): Promise<void> {
    const result = await this.usersRepository.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async save(user: UserTypeOrmEntity): Promise<UserTypeOrmEntity> {
    return this.usersRepository.save(user);
  }

  async remove(user: UserTypeOrmEntity): Promise<void> {
    await this.usersRepository.remove(user);
  }

  // Method to get user with full data (including sensitive information)
  async findFullDataById(id: string): Promise<UserFullData | null> {
    const user = await this.findById(id);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      isEmailConfirmed: user.isEmailConfirmed,
      confirmationCode: user.confirmationCode,
      expirationDate: user.expirationDate,
      firstName: user.firstName,
      lastName: user.lastName,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
} 