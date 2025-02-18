import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CommentsQueryRepository } from '../infrastructure/query/comment.query-repository';
import { CommentViewDto } from './view-dto/comments.view-dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Return comment by ID' })
  async getCommentByID(@Param('id') id: string): Promise<CommentViewDto> {
    return this.commentsQueryRepository.getById(id);
  }
}
