import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostsQueryRepository } from '../infrastructure/query/post.query-repository';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from './view-dto/posts.view-dto';

@Controller('sa/posts')
export class PostsSaController {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllPosts(@Query() query: GetPostsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query);
  }

  @Post()
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostViewDto> {
    const postId = await this.postsRepository.save({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: '', // blogName не нужен для создания, он подтянется при выборке
    });
    return this.postsQueryRepository.getById(postId);
  }

  @Put(':id')
  @HttpCode(204)
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(id);
    post.title = dto.title ?? post.title;
    post.shortDescription = dto.shortDescription ?? post.shortDescription;
    post.content = dto.content ?? post.content;
    post.blogId = dto.blogId ? dto.blogId : post.blogId;
    await this.postsRepository.save(post);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postsRepository.deleteById(id);
  }
} 