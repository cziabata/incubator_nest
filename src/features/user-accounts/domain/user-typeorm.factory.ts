import { UserTypeOrmEntity } from './user-typeorm.entity';
import {
  CreateUserTypeOrmDto,
  CreateUserWithConfirmationTypeOrmDto,
} from './types/user-typeorm.types';

export class UserTypeOrmFactory {
  /**
   * Create a new user instance with basic information
   */
  static createUser(dto: CreateUserTypeOrmDto): UserTypeOrmEntity {
    const user = new UserTypeOrmEntity();
    
    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.isEmailConfirmed = dto.isEmailConfirmed ?? false;
    user.confirmationCode = dto.confirmationCode ?? null;
    user.expirationDate = dto.expirationDate ?? null;
    user.firstName = dto.firstName ?? null;
    user.lastName = dto.lastName ?? null;
    user.deletedAt = null;
    
    return user;
  }

  /**
   * Create a new user instance with email confirmation data
   */
  static createUserWithConfirmation(dto: CreateUserWithConfirmationTypeOrmDto): UserTypeOrmEntity {
    const user = new UserTypeOrmEntity();
    
    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.confirmationCode = dto.confirmationCode;
    user.expirationDate = dto.expirationDate;
    user.isEmailConfirmed = dto.isEmailConfirmed;
    user.firstName = dto.firstName ?? null;
    user.lastName = dto.lastName ?? null;
    user.deletedAt = null;
    
    return user;
  }

  /**
   * Create a user for registration (with confirmation code and expiration)
   */
  static createUserForRegistration(
    login: string,
    email: string,
    passwordHash: string,
    confirmationCode: string,
    expirationDate: Date,
    firstName?: string,
    lastName?: string,
  ): UserTypeOrmEntity {
    return this.createUserWithConfirmation({
      login,
      email,
      passwordHash,
      confirmationCode,
      expirationDate,
      isEmailConfirmed: false,
      firstName,
      lastName,
    });
  }

  /**
   * Create a user with confirmed email
   */
  static createConfirmedUser(
    login: string,
    email: string,
    passwordHash: string,
    firstName?: string,
    lastName?: string,
  ): UserTypeOrmEntity {
    return this.createUser({
      login,
      email,
      passwordHash,
      isEmailConfirmed: true,
      firstName,
      lastName,
    });
  }

  /**
   * Create user from existing Mongoose user data (for migration)
   */
  static createFromMongooseUser(mongoUser: any): UserTypeOrmEntity {
    const user = new UserTypeOrmEntity();
    
    // Map fields from Mongoose user to TypeORM user
    user.id = mongoUser.id;
    user.login = mongoUser.login;
    user.email = mongoUser.email;
    user.passwordHash = mongoUser.passwordHash;
    user.isEmailConfirmed = mongoUser.isEmailConfirmed;
    user.confirmationCode = mongoUser.confirmationCode;
    user.expirationDate = mongoUser.expirationDate;
    user.firstName = mongoUser.name?.firstName || null;
    user.lastName = mongoUser.name?.lastName || null;
    user.deletedAt = mongoUser.deletedAt;
    user.createdAt = mongoUser.createdAt;
    user.updatedAt = mongoUser.updatedAt;
    
    return user;
  }

  /**
   * Create minimal user for testing
   */
  static createTestUser(
    login: string = 'testuser',
    email: string = 'test@example.com',
    passwordHash: string = 'hashedpassword',
  ): UserTypeOrmEntity {
    return this.createConfirmedUser(login, email, passwordHash, 'Test', 'User');
  }
} 