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
} from '@nestjs/common';
import { BlogsService } from '../application/blogs.service';
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

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
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
    return this.postsQueryRepository.getPostsByBlogId(id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog' })
  async createBlog(
    @Body() createBlogInputDto: CreateBlogInputDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(createBlogInputDto);
    return this.blogsQueryRepository.getById(blogId);
  }

  @Put(':id')
  @HttpCode(204)
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    await this.blogsService.updateBlog(id, body);
    return;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.blogsService.deleteBlog(id);
  }
}
