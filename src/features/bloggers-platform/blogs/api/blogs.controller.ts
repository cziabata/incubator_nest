import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/post.query-repository';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { CreatePostForSpecificBlogInputDto } from './input-dto/create-blog-post.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogUsecaseCommand } from '../application/usecases/create-blog.usecase';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { GetBlogPostsQuery } from '../application/usecases/get-blog-posts.usecase';
import { CreatePostForSpecificBlogCommand } from '../../posts/application/usecases/create-post-for-specific-blog.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getBlogById(@Param('id', ParseUUIDPipe) id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getById(id);
  }

  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getBlogPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const userId = user?.id;
    return this.queryBus.execute(new GetBlogPostsQuery(id, query, userId));
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogUsecaseCommand(createBlogInputDto),
    );
    return this.blogsQueryRepository.getById(blogId);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard, JwtOptionalAuthGuard)
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() createPostForSpecificInputDto: CreatePostForSpecificBlogInputDto,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    const userId = user?.id;
    const postId = await this.commandBus.execute(
      new CreatePostForSpecificBlogCommand(id, createPostForSpecificInputDto),
    );
    return this.postsQueryRepository.getById(postId, userId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updateBlog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogInputDto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateBlogCommand(id, updateBlogInputDto),
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deleteBlog(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async createPostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Body() dto: CreatePostForSpecificBlogInputDto,
  ): Promise<PostViewDto> {
    const blog = await this.blogsQueryRepository.getById(blogId);
    const postId = await this.postsRepository.save({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blogId,
      blogName: blog.name,
    });
    return this.postsQueryRepository.getById(postId);
  }
}
