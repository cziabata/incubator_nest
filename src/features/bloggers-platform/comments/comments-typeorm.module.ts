import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentTypeOrm } from './domain/comment-typeorm.entity';
import { CommentLikeTypeOrm } from './domain/comment-like-typeorm.entity';
import { CommentsTypeOrmRepository } from './infrastructure/comments-typeorm.repository';
import { CommentsTypeOrmQueryRepository } from './infrastructure/query/comments-typeorm.query-repository';
import { CommentsTypeOrmService } from './application/comments-typeorm.service';
import { CommentsTypeOrmController } from './api/comments-typeorm.controller';
import { UserAccountsTypeOrmModule } from '../../user-accounts/user-accounts-typeorm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentTypeOrm, CommentLikeTypeOrm]),
    forwardRef(() => import('../posts/posts-typeorm.module').then(m => m.PostsTypeOrmModule)),
    UserAccountsTypeOrmModule
  ],
  controllers: [
    CommentsTypeOrmController
  ],
  providers: [
    CommentsTypeOrmRepository,
    CommentsTypeOrmQueryRepository,
    CommentsTypeOrmService
  ],
  exports: [
    CommentsTypeOrmRepository,
    CommentsTypeOrmQueryRepository,
    CommentsTypeOrmService,
    TypeOrmModule
  ]
})
export class CommentsTypeOrmModule {} 