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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostsQueryRepository } from '../infrastructure/query/post.query-repository';
import { PostViewDto } from './view-dto/posts.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comment.query-repository';
import { CommentViewDto } from '../../comments/api/view-dto/comments.view-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { PostsService } from '../application/posts.service';
import { UpdatePostLikeStatusInputDto } from './input-dto/update-post-like-status.input-dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/query/users.query-repository';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly postsService: PostsService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Return all posts' })
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const userId = user?.id;
    return this.postsQueryRepository.getAll(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Return post by ID' })
  @ApiResponse({ status: 200, description: 'Returns post', type: PostViewDto })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostByID(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    const userId = user?.id;
    const post = await this.postsQueryRepository.getById(id, userId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Return all comments for post' })
  async getAllPostComments(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const userId = user?.id;
    // Проверяем существование поста
    const post = await this.postsQueryRepository.getById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.commentsQueryRepository.getAllByPostId(id, query, userId);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a post' })
  async createPost(
    @Body() createPostInputDto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(
      new CreatePostCommand(createPostInputDto),
    );
    return this.postsQueryRepository.getById(postId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostInputDto: UpdatePostInputDto,
  ): Promise<void> {
    // Проверяем существование поста
    const post = await this.postsQueryRepository.getById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.commandBus.execute(
      new UpdatePostCommand(id, updatePostInputDto),
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(id));
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update like status for the post' })
  @ApiResponse({ status: 204, description: 'Like status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updateLikeStatus(
    @Param('id') postId: string,
    @Body() dto: UpdatePostLikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    const userId = user.id;
    if (!userId) {
      throw new ForbiddenException('User id not found');
    }

    // Получаем информацию о пользователе из базы данных
    const userFromDb =
      await this.usersQueryRepository.getByIdOrNotFoundFail(userId);

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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment for specific post' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentViewDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    // Проверяем существование поста
    const post = await this.postsQueryRepository.getById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Получаем информацию о пользователе
    const userFromDb = await this.usersQueryRepository.getByIdOrNotFoundFail(
      user.id,
    );

    // Создаем новый комментарий
    const newCommentDto = {
      content: createCommentDto.content,
      commentatorInfo: {
        userId: user.id,
        userLogin: userFromDb.login,
      },
      postId,
    };

    // Отправляем команду на создание комментария
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(newCommentDto),
    );

    // Возвращаем созданный комментарий
    return this.commentsQueryRepository.getById(commentId);
  }
}
