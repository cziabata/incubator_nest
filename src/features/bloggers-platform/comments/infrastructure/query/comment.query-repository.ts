import { NotFoundException } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { FilterQuery } from 'mongoose';
import { Post, PostModelType } from '../../../posts/domain/post.entity';

export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async getById(id: string, userId?: string): Promise<CommentViewDto> {
    const comment = await this.CommentModel.findOne({
      _id: id,
    });

    if (!comment) {
      throw new NotFoundException('comment not found');
    }
    return CommentViewDto.mapToView(comment, userId);
  }

  async getAllByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const post = await this.PostModel.findOne({ _id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const filter: FilterQuery<Comment> = { postId };

    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map((comment) =>
      CommentViewDto.mapToView(comment, userId),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
