import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '../../../core/exceptions/domain-exceptions';
import { UpdateUserDto } from '../dto/create-user.dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        login, 
        email, 
        password_hash as "passwordHash", 
        is_emai_confirmed as "isEmailConfirmed",
        confirmation_code as "confirmationCode",
        expiration_date as "expirationDate",
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [id]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  async save(user: any): Promise<string> {
    if (user.id) {
      // Обновление существующего пользователя
      const sqlQuery = `
        UPDATE users 
        SET 
          login = $1, 
          email = $2, 
          password_hash = $3, 
          is_emai_confirmed = $4,
          confirmation_code = $5,
          expiration_date = $6,
          first_name = $7,
          last_name = $8,
          updated_at = CURRENT_DATE
        WHERE id = $9 AND deleted_at IS NULL
        RETURNING id
      `;
      
      const result = await this.dataSource.query(sqlQuery, [
        user.login,
        user.email,
        user.passwordHash,
        user.isEmailConfirmed,
        user.confirmationCode,
        user.expirationDate,
        user.firstName,
        user.lastName,
        user.id
      ]);
      
      if (!result || result.length === 0) {
        throw NotFoundDomainException.create('user not found');
      }
      
      return result[0].id;
    } else {
      // Создание нового пользователя
      return this.createUser({
        login: user.login,
        email: user.email,
        passwordHash: user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName
      });
    }
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    const user = await this.findById(id);

    if (!user) {
      throw NotFoundDomainException.create('user not found');
    }

    return user;
  }

  async findByLogin(login: string): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        login, 
        email, 
        password_hash as "passwordHash", 
        is_emai_confirmed as "isEmailConfirmed",
        confirmation_code as "confirmationCode",
        expiration_date as "expirationDate",
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE login = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [login]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  async findByEmail(email: string): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        login, 
        email, 
        password_hash as "passwordHash", 
        is_emai_confirmed as "isEmailConfirmed",
        confirmation_code as "confirmationCode",
        expiration_date as "expirationDate",
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [email]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        login, 
        email, 
        password_hash as "passwordHash", 
        is_emai_confirmed as "isEmailConfirmed",
        confirmation_code as "confirmationCode",
        expiration_date as "expirationDate",
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE (login = $1 OR email = $1) AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [loginOrEmail]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  async findByConfirmationCode(confirmationCode: string): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        login, 
        email, 
        password_hash as "passwordHash", 
        is_emai_confirmed as "isEmailConfirmed",
        confirmation_code as "confirmationCode",
        expiration_date as "expirationDate",
        created_at as "createdAt",
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE confirmation_code = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [confirmationCode]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return result[0];
  }

  async loginIsExist(login: string): Promise<boolean> {
    const sqlQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE login = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [login]);
    
    return parseInt(result[0].count) > 0;
  }

  async emailIsExist(email: string): Promise<boolean> {
    const sqlQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [email]);
    
    return parseInt(result[0].count) > 0;
  }

  async createUserWithConfirmation(dto: {
    login: string;
    email: string;
    passwordHash: string;
    confirmationCode: string;
    expirationDate: Date;
    isEmailConfirmed: boolean;
    firstName?: string;
    lastName?: string;
  }): Promise<string> {
    const sqlQuery = `
      INSERT INTO users (
        login, 
        email, 
        password_hash, 
        confirmation_code,
        expiration_date,
        is_emai_confirmed,
        first_name, 
        last_name,
        created_at, 
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, CURRENT_DATE)
      RETURNING id
    `;
    
    const result = await this.dataSource.query(sqlQuery, [
      dto.login,
      dto.email,
      dto.passwordHash,
      dto.confirmationCode,
      dto.expirationDate,
      dto.isEmailConfirmed,
      dto.firstName || null,
      dto.lastName || null
    ]);
    
    return result[0].id;
  }

  async updateConfirmationCode(
    userId: string, 
    confirmationCode: string, 
    expirationDate: Date
  ): Promise<void> {
    const sqlQuery = `
      UPDATE users 
      SET 
        confirmation_code = $1, 
        expiration_date = $2,
        updated_at = CURRENT_DATE
      WHERE id = $3 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [
      confirmationCode,
      expirationDate,
      userId
    ]);
    
    if (result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }
  
  async updateConfirmationCodeAndResetConfirmation(
    userId: string, 
    confirmationCode: string, 
    expirationDate: Date
  ): Promise<void> {
    const sqlQuery = `
      UPDATE users 
      SET 
        confirmation_code = $1, 
        expiration_date = $2,
        is_emai_confirmed = false,
        updated_at = CURRENT_DATE
      WHERE id = $3 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [
      confirmationCode,
      expirationDate,
      userId
    ]);
    
    if (result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }
  
  async confirmEmail(userId: string): Promise<void> {
    const sqlQuery = `
      UPDATE users 
      SET 
        is_emai_confirmed = true,
        updated_at = CURRENT_DATE
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [userId]);
    
    if (result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }
  
  async updatePasswordAndConfirmEmail(
    userId: string,
    passwordHash: string
  ): Promise<void> {
    const sqlQuery = `
      UPDATE users 
      SET 
        password_hash = $1,
        is_emai_confirmed = true,
        updated_at = CURRENT_DATE
      WHERE id = $2 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [
      passwordHash,
      userId
    ]);
    
    if (result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }

  async createUser(dto: {
    login: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }): Promise<string> {
    const sqlQuery = `
      INSERT INTO users (
        login, 
        email, 
        password_hash, 
        first_name, 
        last_name,
        is_emai_confirmed,
        created_at, 
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE, CURRENT_DATE)
      RETURNING id
    `;
    
    const result = await this.dataSource.query(sqlQuery, [
      dto.login,
      dto.email,
      dto.passwordHash,
      dto.firstName || null,
      dto.lastName || null
    ]);
    
    return result[0].id;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const sqlQuery = `
      UPDATE users 
      SET 
        email = $1, 
        updated_at = CURRENT_DATE
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    
    const result = await this.dataSource.query(sqlQuery, [dto.email, id]);
    
    if (!result || result.length === 0 || result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
    
    return result[0].id.toString();
  }

  async deleteUserById(id: string): Promise<void> {
    const sqlQuery = `
      UPDATE users 
      SET deleted_at = CURRENT_DATE
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [id]);
    
    if (result[1] === 0) {
      throw NotFoundDomainException.create('user not found');
    }
  }
}
