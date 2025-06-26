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
import { CommentsTypeOrmQueryRepository } from '../infrastructure/query/comments-typeorm.query-repository';
import { CommentsTypeOrmService } from '../application/comments-typeorm.service';
import { CommentViewDto } from './view-dto/comments.view-dto';
import { UpdateCommentInputDto } from './input-dto/update-comment.input-dto';
import { LikeStatusInputDto } from './input-dto/like-status.input-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { ParseUUIDPipe } from '../../../../core/pipes/parse-uuid.pipe';

@Controller('comments')
export class CommentsTypeOrmController {
  constructor(
    private readonly commentsQueryRepository: CommentsTypeOrmQueryRepository,
    private readonly commentsService: CommentsTypeOrmService,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentByID(
    @Param('id', ParseUUIDPipe) id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const userId = user?.id;
    return this.commentsQueryRepository.getById(id, userId);
  }

  @Put(':commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
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
    await this.commentsService.updateComment(commentId, { content: dto.content });
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('commentId', ParseUUIDPipe) commentId: string,
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