import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
// import { BlogsController } from './blogs/api/blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
// import { PostsController } from './posts/api/posts.controller';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/query/post.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
// import { CommentsController } from './comments/api/comments.controller';
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
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { UpdateCommentUseCase } from './comments/application/usecases/update-comment.usecase';
import { DeleteCommentUseCase } from './comments/application/usecases/delete-comment.usecase';
import { UpdateCommentLikeStatusUseCase } from './comments/application/usecases/update-comment-like-status.usecase';
import { CommentsService } from './comments/application/comments.service';
import { UpdatePostLikeStatusUseCase } from './posts/application/usecases/update-post-like-status.usecase';
import { PostsService } from './posts/application/posts.service';
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
// import { BlogsSaController } from './blogs/api/blogs.sa.controller';
// import { PostsSaController } from './posts/api/posts.sa.controller';
import { BlogsTypeOrmModule } from './blogs/blogs-typeorm.module';
import { PostsTypeOrmModule } from './posts/posts-typeorm.module';
import { CommentsTypeOrmModule } from './comments/comments-typeorm.module';
import { QuizTypeOrmModule } from './quiz/quiz.module';

// const blogUseCases = [
//   CreateBlogUseCase,
//   UpdateBlogUseCase,
//   DeleteBlogUseCase,
//   GetBlogPostsUseCase
// ];

// const postUseCases = [
//   CreatePostUseCase,
//   CreatePostForSpecificBlogUseCase,
//   UpdatePostUseCase,
//   DeletePostUseCase,
//   UpdatePostLikeStatusUseCase
// ];

// const commentUseCases = [
//   CreateCommentUseCase,
//   UpdateCommentUseCase,
//   DeleteCommentUseCase,
//   UpdateCommentLikeStatusUseCase
// ];

@Module({
  imports: [
    // UserAccountsModule,
    QuizTypeOrmModule,
    CqrsModule,
    BlogsTypeOrmModule,
    PostsTypeOrmModule,
    CommentsTypeOrmModule,
    // MongooseModule.forFeature([
    //   { name: Blog.name, schema: BlogSchema },
    //   { name: Post.name, schema: PostSchema },
    //   { name: Comment.name, schema: CommentSchema },
    // ]),
  ],
  controllers: [
    // Temporarily disabled to avoid route conflicts with TypeORM versions
    // BlogsController, 
    // PostsController, 
    // CommentsController, 
    // BlogsSaController, 
    // PostsSaController
  ],
  providers: [
    // ...blogUseCases,
    // ...postUseCases,
    // ...commentUseCases,
    // BlogsRepository,
    // BlogsQueryRepository,
    // PostsRepository,
    // PostsQueryRepository,
    // CommentsQueryRepository,
    // CommentsRepository,
    // CommentsService,
    // PostsService,
  ],
  exports: [
    // BlogsRepository,
    // PostsRepository,
    // CommentsQueryRepository,
    // CommentsRepository,
    // CommentsService,
    // PostsService,
    // MongooseModule,
  ],
})
export class BloggersPlatformModule {}
