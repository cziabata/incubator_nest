import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TestingModule } from './features/testing/testing.module';
import { CoreModule } from './core/core.module';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GLOBAL_PREFIX } from './setup/global-prefix.setup';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL || '', {
      dbName: process.env.DB_NAME || 'incubator',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot:
        process.env.NODE_ENV === 'development' ? '/' : `/${GLOBAL_PREFIX}`,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000, // Окно в 10 секунд
          limit: 5, // Максимум 5 запросов за это время
        },
      ],
    }),
    TestingModule,
    CoreModule,
    BloggersPlatformModule,
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
