import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogTypeOrm } from './domain/blog-typeorm.entity';
import { BlogsTypeOrmRepository } from './infrastructure/blogs-typeorm.repository';
import { BlogsTypeOrmQueryRepository } from './infrastructure/query/blogs-typeorm.query-repository';
import { BlogsTypeOrmService } from './application/blogs-typeorm.service';
import { BlogsSaTypeOrmController } from './api/blogs-typeorm.controller';
import { BlogsTypeOrmController } from './api/blogs-public-typeorm.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogTypeOrm]),
    forwardRef(() => import('../posts/posts-typeorm.module').then(m => m.PostsTypeOrmModule))
  ],
  controllers: [
    BlogsSaTypeOrmController,
    BlogsTypeOrmController
  ],
  providers: [
    BlogsTypeOrmRepository,
    BlogsTypeOrmQueryRepository,
    BlogsTypeOrmService
  ],
  exports: [
    BlogsTypeOrmRepository,
    BlogsTypeOrmQueryRepository,
    BlogsTypeOrmService,
    TypeOrmModule
  ]
})
export class BlogsTypeOrmModule {} 