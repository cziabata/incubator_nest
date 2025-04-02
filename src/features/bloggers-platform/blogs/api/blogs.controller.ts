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
import { ApiOperation } from '@nestjs/swagger';
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

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Return all blogs' })
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Return blog by ID' })
  async getBlogByID(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getById(id);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Return posts by blog ID' })
  async getBlogPosts(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute(new GetBlogPostsQuery(id, query));
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create new blog' })
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogUsecaseCommand(createBlogInputDto),
    );
    return this.blogsQueryRepository.getById(blogId);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a post for specific blog' })
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() createPostForSpecificInputDto: CreatePostForSpecificBlogInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(
      new CreatePostForSpecificBlogCommand(id, createPostForSpecificInputDto),
    );
    return this.postsQueryRepository.getById(postId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Update blog by ID' })
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogInputDto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateBlogCommand(id, updateBlogInputDto),
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete blog by ID' })
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(id));
  }
}
