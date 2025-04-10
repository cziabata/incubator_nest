import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller';
import { SessionQueryRepository } from './infrastructure/query/session.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { SessionController } from './api/sessions.controller';
import { CryptoService } from './application/crypto.service';
import { AuthService } from './application/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailModule } from '../notifications/notifications.module';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { RefreshTokenStrategy } from './guards/bearer/refresh-token.strategy';
import { Session, SessionSchema } from './domain/session.entity';
import { BlacklistedRefreshTokenRepository } from './infrastructure/blacklisted-refresh-token.repository';
import {
  BlacklistedToken,
  BlacklistedTokenSchema,
} from './domain/blacklisted-token.entity';
import { SessionService } from './application/session.service';
import { SessionRepository } from './infrastructure/session.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
    EmailModule,
    JwtModule.register({
      secret: 'access-token-secret',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [UsersController, AuthController, SessionController],
  providers: [
    UsersService,
    CryptoService,
    SessionService,
    SessionRepository,
    SessionQueryRepository,
    AuthService,
    JwtService,
    UsersRepository,
    UsersQueryRepository,
    BlacklistedRefreshTokenRepository,
    AuthQueryRepository,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [
    UsersRepository,
    MongooseModule,
    JwtStrategy,
    UsersQueryRepository,
    SessionService,
    SessionRepository,
    SessionQueryRepository,
  ],
})
export class UserAccountsModule {}
