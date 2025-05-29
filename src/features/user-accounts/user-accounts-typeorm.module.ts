import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { UserTypeOrmEntity } from './domain/user-typeorm.entity';
import { SessionTypeOrmEntity } from './domain/session-typeorm.entity';
import { BlacklistedRefreshTokenTypeOrmEntity } from './domain/blacklisted-refresh-token-typeorm.entity';

// Repositories
import { UsersTypeOrmRepository } from './infrastructure/users-typeorm.repository';
import { SessionTypeOrmRepository } from './infrastructure/session-typeorm.repository';
import { BlacklistedRefreshTokenTypeOrmRepository } from './infrastructure/blacklisted-refresh-token-typeorm.repository';

// Query Repositories
import { UsersTypeOrmQueryRepository } from './infrastructure/query/users-typeorm.query-repository';
import { SessionTypeOrmQueryRepository } from './infrastructure/query/session-typeorm.query-repository';
import { AuthTypeOrmQueryRepository } from './infrastructure/query/auth-typeorm.query-repository';
import { BlacklistedRefreshTokenTypeOrmQueryRepository } from './infrastructure/query/blacklisted-refresh-token-typeorm.query-repository';

// Services
import { UsersTypeOrmService } from './application/users-typeorm.service';
import { SessionTypeOrmService } from './application/session-typeorm.service';
import { AuthTypeOrmService } from './application/auth-typeorm.service';
import { CryptoService } from './application/crypto.service';

// Controllers
import { UsersTypeOrmController } from './api/users-typeorm.controller';
import { AuthTypeOrmController } from './api/auth-typeorm.controller';
import { SessionTypeOrmController } from './api/sessions-typeorm.controller';

// Guards and Strategies
import { RefreshTokenTypeOrmStrategy } from './guards/bearer/refresh-token-typeorm.strategy';

// External modules
import { EmailModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    TypeOrmModule.forFeature([
      UserTypeOrmEntity, 
      SessionTypeOrmEntity,
      BlacklistedRefreshTokenTypeOrmEntity
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    UsersTypeOrmController,
    AuthTypeOrmController,
    SessionTypeOrmController,
  ],
  providers: [
    // Repositories
    UsersTypeOrmRepository,
    SessionTypeOrmRepository,
    BlacklistedRefreshTokenTypeOrmRepository,
    
    // Query Repositories
    UsersTypeOrmQueryRepository,
    SessionTypeOrmQueryRepository,
    AuthTypeOrmQueryRepository,
    BlacklistedRefreshTokenTypeOrmQueryRepository,
    
    // Services
    UsersTypeOrmService,
    SessionTypeOrmService,
    AuthTypeOrmService,
    CryptoService,

    // Guards and Strategies
    RefreshTokenTypeOrmStrategy,
  ],
  exports: [
    UsersTypeOrmService,
    SessionTypeOrmService,
    AuthTypeOrmService,
    UsersTypeOrmRepository,
    SessionTypeOrmRepository,
    BlacklistedRefreshTokenTypeOrmRepository,
    UsersTypeOrmQueryRepository,
    SessionTypeOrmQueryRepository,
    AuthTypeOrmQueryRepository,
    BlacklistedRefreshTokenTypeOrmQueryRepository,
  ],
})
export class UserAccountsTypeOrmModule {} 