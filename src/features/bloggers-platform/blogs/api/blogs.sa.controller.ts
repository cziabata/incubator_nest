import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../posts/infrastructure/query/post.query-repository';
import { CreatePostForSpecificBlogInputDto } from './input-dto/create-blog-post.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';
import { UpdatePostInputDto } from '../../posts/api/input-dto/update-post.input-dto';

@Controller('sa/blogs')
export class BlogsSaController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllBlogs(@Query() query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogsRepository.save({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      isMembership: false,
    });
    return this.blogsQueryRepository.getById(blogId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updateBlog(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogInputDto): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);
    await this.blogsRepository.save({
      id: blog.id,
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      isMembership: blog.isMembership ?? false,
    });
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deleteBlog(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(id);
    await this.blogsRepository.deleteById(id);
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

  @Get(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async getPostsForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.blogsRepository.findOrNotFoundFail(blogId);
    const result = await this.postsRepository.getPostsByBlogId(blogId, query);
    return result;
  }

  @Put(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updatePostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostInputDto,
  ): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(blogId);
    const post = await this.postsRepository.findOrNotFoundFail(postId);
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = blogId;
    await this.postsRepository.save(post);
  }

  @Delete(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deletePostForBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(blogId);
    await this.postsRepository.findOrNotFoundFail(postId);
    await this.postsRepository.deleteById(postId);
  }
} 