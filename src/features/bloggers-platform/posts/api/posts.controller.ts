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
import { PostsService } from '../application/posts.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { PostsQueryRepository } from '../infrastructure/query/post.query-repository';
import { PostViewDto } from './view-dto/posts.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comments.view-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comment.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Return all posts' })
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Return post by ID' })
  async getPostByID(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryRepository.getById(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Return all comments for post' })
  async getAllPostComments(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.commentsQueryRepository.getAllByPostId(id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(createPostInputDto);
    return this.postsQueryRepository.getById(postId);
  }

  @Put(':id')
  @HttpCode(204)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    await this.postsService.updatePost(id, body);
    return;
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postsService.deletePost(id);
  }
}
