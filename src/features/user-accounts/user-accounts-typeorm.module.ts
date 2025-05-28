import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeOrmEntity } from './domain/user-typeorm.entity';
import { UsersTypeOrmRepository } from './infrastructure/users-typeorm.repository';
import { UsersTypeOrmQueryRepository } from './infrastructure/query/users-typeorm.query-repository';
import { UsersTypeOrmService } from './application/users-typeorm.service';
import { UsersTypeOrmController } from './api/users-typeorm.controller';
import { CryptoService } from './application/crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeOrmEntity])],
  controllers: [UsersTypeOrmController],
  providers: [
    UsersTypeOrmRepository,
    UsersTypeOrmQueryRepository,
    UsersTypeOrmService,
    CryptoService,
  ],
  exports: [
    UsersTypeOrmRepository,
    UsersTypeOrmQueryRepository,
    UsersTypeOrmService,
    TypeOrmModule,
  ],
})
export class UserAccountsTypeOrmModule {} 