import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TestingModule } from './features/testing/testing.module';
import { CoreModule } from './core/core.module';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsTypeOrmModule } from './features/user-accounts/user-accounts-typeorm.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL || '', {
      dbName: process.env.DB_NAME || 'incubator',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // Окно в 1 минуту
          limit: 100, // Максимум 100 запросов за это время
        },
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGE_DB_HOST || '',
      port: 5432,
      username: process.env.POSTGE_DB_USERNAME || '',
      password: process.env.POSTGE_DB_PASSWORD || '',
      database: process.env.POSTGE_DB_NAME || '',
      ssl: true,
      autoLoadEntities: true,
      synchronize: true, // Important: set to false in production
    }),
    CqrsModule.forRoot(),
    TestingModule,
    CoreModule,
    BloggersPlatformModule,
    UserAccountsTypeOrmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
