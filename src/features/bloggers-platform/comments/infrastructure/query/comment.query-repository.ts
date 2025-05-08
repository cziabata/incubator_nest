import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async getById(id: string, userId?: string): Promise<CommentViewDto> {
    const comment = await this.dataSource.query(
      `SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN cl.status = 'Like' THEN 1 ELSE 0 END), 0) AS likes_count,
        COALESCE(SUM(CASE WHEN cl.status = 'Dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
        (
          SELECT status FROM comment_likes 
          WHERE comment_id = c.id AND user_id = $2
        ) AS my_status
      FROM comments c
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [id, userId || '00000000-0000-0000-0000-000000000000']
    );

    if (!comment || comment.length === 0) {
      throw new NotFoundException('comment not found');
    }

    return this.mapCommentToView(comment[0], userId);
  }

  async getAllByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // Проверка существования поста
    const post = await this.dataSource.query(
      `SELECT * FROM posts WHERE id = $1`,
      [postId]
    );
    
    if (!post || post.length === 0) {
      throw new NotFoundException('Post not found');
    }

    // Определение сортировки
    const sortByMap: Record<string, string> = {
      createdAt: 'created_at',
      content: 'content',
    };
    const sortBy = sortByMap[query.sortBy] || 'created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    // Получение комментариев с информацией о лайках
    const commentsWithLikes = await this.dataSource.query(
      `SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN cl.status = 'Like' THEN 1 ELSE 0 END), 0) AS likes_count,
        COALESCE(SUM(CASE WHEN cl.status = 'Dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
        (
          SELECT status FROM comment_likes 
          WHERE comment_id = c.id AND user_id = $4
        ) AS my_status
      FROM comments c
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id
      WHERE c.post_id = $1
      GROUP BY c.id
      ${orderBy}
      OFFSET $2 LIMIT $3`,
      [postId, offset, limit, userId || '00000000-0000-0000-0000-000000000000']
    );

    // Получение общего количества комментариев
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM comments WHERE post_id = $1`,
      [postId]
    );
    const totalCount = parseInt(countResult[0].count, 10);

    // Преобразование комментариев в DTO
    const items = commentsWithLikes.map(comment => this.mapCommentToView(comment, userId));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private mapCommentToView(comment: any, userId?: string): CommentViewDto {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.user_id,
        userLogin: comment.user_login,
      },
      createdAt: comment.created_at,
      likesInfo: {
        likesCount: parseInt(comment.likes_count),
        dislikesCount: parseInt(comment.dislikes_count),
        myStatus: comment.my_status || 'None',
      },
    };
  }
}
