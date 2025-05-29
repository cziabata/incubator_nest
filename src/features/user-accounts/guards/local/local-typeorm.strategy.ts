import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthTypeOrmService } from '../../application/auth-typeorm.service';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain-exceptions';
import { UserContextDto } from '../dto/user-context.dto';

@Injectable()
export class LocalTypeOrmStrategy extends PassportStrategy(Strategy, 'local-typeorm') {
  constructor(private authTypeOrmService: AuthTypeOrmService) {
    super({ usernameField: 'login' });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(username: string, password: string): Promise<UserContextDto> {
    const user = await this.authTypeOrmService.validateUser(username, password);
    if (!user) {
      throw UnauthorizedDomainException.create();
    }

    return user;
  }
} 