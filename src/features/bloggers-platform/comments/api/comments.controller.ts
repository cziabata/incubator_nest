import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  Body,
  HttpCode,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommentsQueryRepository } from '../infrastructure/query/comment.query-repository';
import { CommentViewDto } from './view-dto/comments.view-dto';
import { UpdateCommentInputDto } from './input-dto/update-comment.input-dto';
import { LikeStatusInputDto } from './input-dto/like-status.input-dto';
import { CommentsService } from '../application/comments.service';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsService: CommentsService,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Return comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns comment',
    type: CommentViewDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentByID(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const userId = user?.id;
    return this.commentsQueryRepository.getById(id, userId);
  }

  @Put(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update comment by ID' })
  @ApiResponse({ status: 204, description: 'Comment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the comment owner',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    // Проверка существования комментария
    let comment;
    try {
      comment = await this.commentsQueryRepository.getById(commentId);
    } catch (error) {
      throw new NotFoundException('Comment not found');
    }

    // Проверка права на редактирование
    if (comment.commentatorInfo.userId !== user.id) {
      throw new ForbiddenException(
        'You try to edit the comment that is not your own',
      );
    }

    // Обновление комментария
    await this.commentsService.updateComment(commentId, dto.content);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment by ID' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the comment owner',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    // Проверка существования комментария
    let comment;
    try {
      comment = await this.commentsQueryRepository.getById(commentId);
    } catch (error) {
      throw new NotFoundException('Comment not found');
    }

    // Проверка права на удаление
    if (comment.commentatorInfo.userId !== user.id) {
      throw new ForbiddenException(
        'You try to delete the comment that is not your own',
      );
    }

    // Удаление комментария
    await this.commentsService.deleteComment(commentId);
  }

  @Put(':commentId/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update like status for the comment' })
  @ApiResponse({ status: 204, description: 'Like status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateLikeStatus(
    @Param('commentId') commentId: string,
    @Body() dto: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    // Проверка существования комментария
    let comment;
    try {
      comment = await this.commentsQueryRepository.getById(commentId);
    } catch (error) {
      throw new NotFoundException('Comment not found');
    }

    // Обновление статуса лайка
    await this.commentsService.updateCommentLikeStatus(
      commentId,
      user.id,
      dto.likeStatus,
    );
  }
}
