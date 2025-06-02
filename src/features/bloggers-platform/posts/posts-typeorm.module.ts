import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostTypeOrm } from './domain/post-typeorm.entity';
import { PostLikeTypeOrm } from './domain/post-like-typeorm.entity';
import { PostsTypeOrmRepository } from './infrastructure/posts-typeorm.repository';
import { PostsTypeOrmQueryRepository } from './infrastructure/query/posts-typeorm.query-repository';
import { PostsTypeOrmService } from './application/posts-typeorm.service';
import { PostsTypeOrmController } from './api/posts-public-typeorm.controller';
import { PostsSaTypeOrmController } from './api/posts-sa-typeorm.controller';
import { UserAccountsModule } from '../../user-accounts/user-accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostTypeOrm, PostLikeTypeOrm]),
    forwardRef(() => import('../blogs/blogs-typeorm.module').then(m => m.BlogsTypeOrmModule)),
    UserAccountsModule
  ],
  controllers: [
    PostsTypeOrmController,
    PostsSaTypeOrmController
  ],
  providers: [
    PostsTypeOrmRepository,
    PostsTypeOrmQueryRepository,
    PostsTypeOrmService
  ],
  exports: [
    PostsTypeOrmRepository,
    PostsTypeOrmQueryRepository,
    PostsTypeOrmService,
    TypeOrmModule
  ]
})
export class PostsTypeOrmModule {} 