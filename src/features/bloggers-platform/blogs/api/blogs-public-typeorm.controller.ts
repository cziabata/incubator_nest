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
import { BlogsTypeOrmService } from '../application/blogs-typeorm.service';
import { BlogsTypeOrmQueryRepository } from '../infrastructure/query/blogs-typeorm.query-repository';
import { PostsTypeOrmService } from '../../posts/application/posts-typeorm.service';
import { PostsTypeOrmQueryRepository } from '../../posts/infrastructure/query/posts-typeorm.query-repository';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostForSpecificBlogInputDto } from './input-dto/create-blog-post.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';

@Controller('blogs')
export class BlogsTypeOrmController {
  constructor(
    private readonly blogsService: BlogsTypeOrmService,
    private readonly blogsQueryRepository: BlogsTypeOrmQueryRepository,
    private readonly postsService: PostsTypeOrmService,
    private readonly postsQueryRepository: PostsTypeOrmQueryRepository,
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
    return await this.postsQueryRepository.getPostsByBlogId(id, query, userId);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blog = await this.blogsService.createBlog(createBlogInputDto);
    return this.blogsQueryRepository.getById(blog.id);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard, JwtOptionalAuthGuard)
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() createPostForSpecificInputDto: CreatePostForSpecificBlogInputDto,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    const post = await this.postsService.createPostForSpecificBlog(createPostForSpecificInputDto, id);
    return await this.postsQueryRepository.getById(post.id, user?.id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updateBlog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogInputDto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.blogsService.updateBlog(id, updateBlogInputDto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deleteBlog(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.blogsService.deleteBlog(id);
  }
} 