import { NotFoundException } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { FilterQuery } from 'mongoose';

export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
  ) {}

  async getById(id: string): Promise<CommentViewDto> {
    const comment = await this.CommentModel.findOne({
      _id: id,
    });

    if (!comment) {
      throw new NotFoundException('comment not found');
    }
    return CommentViewDto.mapToView(comment);
  }

  async getAllByPostId(
    postId: string,
    query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = { postId };

    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map(CommentViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
