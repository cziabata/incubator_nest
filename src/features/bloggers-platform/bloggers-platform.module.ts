import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/query/post.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsController } from './comments/api/comments.controller';
import { CommentsQueryRepository } from './comments/infrastructure/query/comment.query-repository';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateBlogUseCase } from './blogs/application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './blogs/application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './blogs/application/usecases/delete-blog.usecase';
import { GetBlogPostsUseCase } from './blogs/application/usecases/get-blog-posts.usecase';
import { CreatePostUseCase } from './posts/application/usecases/create-post.usecase';
import { CreatePostForSpecificBlogUseCase } from './posts/application/usecases/create-post-for-specific-blog.usecase';
import { UpdatePostUseCase } from './posts/application/usecases/update-post.usecase';
import { DeletePostUseCase } from './posts/application/usecases/delete-post.usecase';

const blogUseCases = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  GetBlogPostsUseCase
];

const postUseCases = [
  CreatePostUseCase,
  CreatePostForSpecificBlogUseCase,
  UpdatePostUseCase,
  DeletePostUseCase
];

@Module({
  imports: [
    UserAccountsModule,
    CqrsModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    ...blogUseCases,
    ...postUseCases,
    BlogsRepository,
    BlogsQueryRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentsQueryRepository,
  ],
  exports: [
    BlogsRepository,
    PostsRepository,
    CommentsQueryRepository,
    MongooseModule,
  ],
})
export class BloggersPlatformModule {}
