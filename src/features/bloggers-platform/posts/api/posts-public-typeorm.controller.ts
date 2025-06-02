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
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsTypeOrmService } from '../application/posts-typeorm.service';
import { PostsTypeOrmQueryRepository } from '../infrastructure/query/posts-typeorm.query-repository';
import { CommentsTypeOrmService } from '../../comments/application/comments-typeorm.service';
import { CommentsTypeOrmQueryRepository } from '../../comments/infrastructure/query/comments-typeorm.query-repository';
import { PostViewDto } from './view-dto/posts.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { UpdatePostLikeStatusInputDto } from './input-dto/update-post-like-status.input-dto';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comments.view-dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { UsersTypeOrmQueryRepository } from '../../../user-accounts/infrastructure/query/users-typeorm.query-repository';
import { ParseUUIDPipe } from 'src/core/pipes/parse-uuid.pipe';

@Controller('posts')
export class PostsTypeOrmController {
  constructor(
    private readonly postsService: PostsTypeOrmService,
    private readonly postsQueryRepository: PostsTypeOrmQueryRepository,
    private readonly commentsService: CommentsTypeOrmService,
    private readonly commentsQueryRepository: CommentsTypeOrmQueryRepository,
    private readonly usersQueryRepository: UsersTypeOrmQueryRepository,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPosts(
    @Query() query: GetPostsQueryParams, 
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const userId = user?.id;
    return await this.postsQueryRepository.getAll(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostByID(
    @Param('id', ParseUUIDPipe) id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    const userId = user?.id;
    return await this.postsQueryRepository.getById(id, userId);
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPostComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const userId = user?.id;
    return await this.commentsQueryRepository.getCommentsByPostId(id, query, userId);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const post = await this.postsService.createPost(createPostInputDto);
    return await this.postsQueryRepository.getById(post.id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ): Promise<void> {
    await this.postsService.updatePost(id, updatePostInputDto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.postsService.deletePost(id);
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostLikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    const userId = user.id;
    if (!userId) {
      throw new ForbiddenException('User id not found');
    }

    // Получаем информацию о пользователе из базы данных
    const userFromDb = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);

    // Обновляем статус лайка
    await this.postsService.updatePostLikeStatus(
      postId,
      userId,
      userFromDb.login,
      dto.likeStatus,
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() createCommentDto: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const userId = user.id;
    if (!userId) {
      throw new ForbiddenException('User id not found');
    }

    // Получаем информацию о пользователе из базы данных
    const userFromDb = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);

    // Создаем комментарий
    const comment = await this.commentsService.createComment({
      content: createCommentDto.content,
      postId,
      userId,
      userLogin: userFromDb.login,
    });

    return await this.commentsQueryRepository.getById(comment.id, userId);
  }
} 