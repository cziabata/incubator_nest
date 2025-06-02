import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogTypeOrm } from './domain/blog-typeorm.entity';
import { BlogsTypeOrmRepository } from './infrastructure/blogs-typeorm.repository';
import { BlogsTypeOrmQueryRepository } from './infrastructure/query/blogs-typeorm.query-repository';
import { BlogsTypeOrmService } from './application/blogs-typeorm.service';
import { BlogsSaTypeOrmController } from './api/blogs-typeorm.controller';
import { BlogsPublicTypeOrmController } from './api/blogs-public-typeorm.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogTypeOrm])
  ],
  controllers: [
    BlogsSaTypeOrmController,
    BlogsPublicTypeOrmController
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