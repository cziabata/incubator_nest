import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '../../../core/exceptions/domain-exceptions';
import { UpdateUserDto } from '../dto/create-user.dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      throw NotFoundDomainException.create('user not found');
    }

    return user;
  }

  findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    }).exec();
  }

  findByConfirmationCode(
    confirmationCode: string,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      confirmationCode,
    });
  }

  async loginIsExist(login: string): Promise<boolean> {
    return !!(await this.UserModel.countDocuments({ login }));
  }

  async emailIsExist(email: string): Promise<boolean> {
    return !!(await this.UserModel.countDocuments({ email }));
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
