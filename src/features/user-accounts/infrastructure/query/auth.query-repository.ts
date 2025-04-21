import { Injectable } from '@nestjs/common';
import { MeViewDto } from '../../api/view-dto/users.view-dto';
import { UsersRepository } from '../users.repository';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AuthQueryRepository {
  constructor(
    private usersRepository: UsersRepository,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async me(userId: string): Promise<MeViewDto> {
    const sqlQuery = `
      SELECT 
        id as "userId", 
        login, 
        email,
        first_name as "firstName",
        last_name as "lastName"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.dataSource.query(sqlQuery, [userId]);
    
    if (!result || result.length === 0) {
      // Используем существующий метод репозитория, который выкинет правильное исключение
      await this.usersRepository.findOrNotFoundFail(userId);
    }
    
    const user = result[0];
    
    return {
      userId: user.userId,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }
}
