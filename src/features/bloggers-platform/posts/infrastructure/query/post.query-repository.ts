import { Injectable, NotFoundException } from '@nestjs/common';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getById(id: string, userId?: string): Promise<PostViewDto> {
    // Запрос поста с информацией о количестве лайков/дизлайков и статусе текущего пользователя
    const postResult = await this.dataSource.query(
      `SELECT 
        p.*,
        b.name as blog_name,
        COALESCE(SUM(CASE WHEN pl.status = 'Like' THEN 1 ELSE 0 END), 0) AS likes_count,
        COALESCE(SUM(CASE WHEN pl.status = 'Dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
        (
          SELECT status FROM post_likes 
          WHERE post_id = p.id AND user_id = $2
        ) AS my_status
      FROM posts p
      LEFT JOIN blogs b ON p.blog_id = b.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE p.id = $1
      GROUP BY p.id, b.name`,
      [id, userId || '00000000-0000-0000-0000-000000000000']
    );

    if (!postResult[0]) throw new NotFoundException('post not found');

    // Получение трех последних лайков
    const newestLikes = await this.dataSource.query(
      `SELECT user_id, login, added_at 
       FROM post_likes 
       WHERE post_id = $1 AND status = 'Like' 
       ORDER BY added_at DESC 
       LIMIT 3`,
      [id]
    );

    // Преобразование поста в DTO
    return this.mapPostToView(postResult[0], newestLikes, userId);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Здесь можно добавить фильтры по необходимости

    const sortByMap: Record<string, string> = {
      createdAt: 'p.created_at',
      title: 'p.title',
      blogName: 'b.name',
    };
    const sortBy = sortByMap[query.sortBy] || 'p.created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const where = filter.length ? `WHERE ${filter.join(' AND ')}` : '';
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    // Добавляем userId для получения статуса лайка текущего пользователя
    params.push(userId || '00000000-0000-0000-0000-000000000000');
    paramIndex++;

    // Добавляем параметры для пагинации
    params.push(offset);
    params.push(limit);

    // Получаем посты с информацией о лайках
    const postsWithLikes = await this.dataSource.query(
      `SELECT 
        p.*,
        b.name as blog_name,
        COALESCE(SUM(CASE WHEN pl.status = 'Like' THEN 1 ELSE 0 END), 0) AS likes_count,
        COALESCE(SUM(CASE WHEN pl.status = 'Dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
        (
          SELECT status FROM post_likes 
          WHERE post_id = p.id AND user_id = $1
        ) AS my_status
      FROM posts p
      LEFT JOIN blogs b ON p.blog_id = b.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      ${where}
      GROUP BY p.id, b.name
      ${orderBy}
      OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
      params
    );

    // Получаем общее количество постов
    const countParams = where ? params.slice(0, paramIndex - 1) : [];
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM posts p ${where}`,
      countParams
    );
    const totalCount = parseInt(countResult[0].count, 10);

    // Получаем последние лайки для каждого поста
    const postIds = postsWithLikes.map((post: any) => post.id);
    let newestLikesByPostId: Record<string, any[]> = {};
    
    if (postIds.length > 0) {
      const newestLikesQuery = await this.dataSource.query(
        `SELECT post_id, user_id, login, added_at 
         FROM (
           SELECT *, 
             ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY added_at DESC) as row_num
           FROM post_likes 
           WHERE post_id = ANY($1) AND status = 'Like'
         ) AS ranked
         WHERE row_num <= 3`,
        [postIds]
      );
      
      // Группируем лайки по post_id
      newestLikesByPostId = newestLikesQuery.reduce((acc: Record<string, any[]>, like: any) => {
        if (!acc[like.post_id]) {
          acc[like.post_id] = [];
        }
        acc[like.post_id].push({
          userId: like.user_id,
          login: like.login,
          addedAt: like.added_at
        });
        return acc;
      }, {});
      
      // Сортируем лайки для каждого поста по убыванию даты добавления
      for (const postId in newestLikesByPostId) {
        newestLikesByPostId[postId].sort((a, b) => 
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
      }
    }

    // Преобразуем посты в DTO
    const items = postsWithLikes.map((post: any) => 
      this.mapPostToView(post, newestLikesByPostId[post.id] || [], userId)
    );

    return {
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    };
  }

  private mapPostToView(post: any, newestLikes: any[], userId?: string): PostViewDto {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id,
      blogName: post.blog_name,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount: parseInt(post.likes_count || 0),
        dislikesCount: parseInt(post.dislikes_count || 0),
        myStatus: post.my_status || 'None',
        newestLikes: newestLikes.map((like) => ({
          userId: like.userId || like.user_id,
          login: like.login,
          addedAt: like.addedAt || like.added_at
        }))
      }
    };
  }
}
