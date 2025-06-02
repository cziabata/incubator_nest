import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BlogsTypeOrmService } from '../application/blogs-typeorm.service';
import { BlogsTypeOrmQueryRepository } from '../infrastructure/query/blogs-typeorm.query-repository';
import { PostsTypeOrmService } from '../../posts/application/posts-typeorm.service';
import { PostsTypeOrmQueryRepository } from '../../posts/infrastructure/query/posts-typeorm.query-repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blogs.dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostForSpecificBlogInputDto } from './input-dto/create-blog-post.input-dto';
import { UpdatePostInputDto } from '../../posts/api/input-dto/update-post.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';

@Controller('sa/blogs')
export class BlogsSaTypeOrmController {
  constructor(
    private blogsService: BlogsTypeOrmService,
    private blogsQueryRepository: BlogsTypeOrmQueryRepository,
    private postsService: PostsTypeOrmService,
    private postsQueryRepository: PostsTypeOrmQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllBlogs(@Query() query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return await this.blogsQueryRepository.getAll(query);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const blog = await this.blogsService.createBlog(dto);
    return await this.blogsQueryRepository.getById(blog.id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogInputDto): Promise<void> {
    await this.blogsService.updateBlog(id, dto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.blogsService.deleteBlog(id);
  }

  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async createPostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Body() dto: CreatePostForSpecificBlogInputDto,
  ): Promise<PostViewDto> {
    const post = await this.postsService.createPostForSpecificBlog(dto, blogId);
    return await this.postsQueryRepository.getById(post.id);
  }

  @Get(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async getPostsForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return await this.postsQueryRepository.getPostsByBlogId(blogId, query);
  }

  @Put(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostInputDto,
  ): Promise<void> {
    // Проверяем существование блога
    await this.blogsService.getBlogById(blogId);
    // Обновляем пост (сервис проверит существование поста)
    await this.postsService.updatePost(postId, { ...dto, blogId });
  }

  @Delete(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    // Проверяем существование блога
    await this.blogsService.getBlogById(blogId);
    // Удаляем пост (сервис проверит существование поста)
    await this.postsService.deletePost(postId);
  }
} 