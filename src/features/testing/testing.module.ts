import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';

@Module({
  imports: [UserAccountsModule, BloggersPlatformModule],
  controllers: [TestingController],
})
export class TestingModule {}
