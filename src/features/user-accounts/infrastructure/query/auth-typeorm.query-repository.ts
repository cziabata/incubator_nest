import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersTypeOrmQueryRepository } from './users-typeorm.query-repository';
import { MeViewDto } from '../../api/view-dto/users.view-dto';

@Injectable()
export class AuthTypeOrmQueryRepository {
  constructor(
    private usersTypeOrmQueryRepository: UsersTypeOrmQueryRepository,
  ) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.usersTypeOrmQueryRepository.getByIdOrNotFoundFail(userId);
    
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
} 