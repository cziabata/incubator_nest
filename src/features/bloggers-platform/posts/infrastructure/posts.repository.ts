import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findById(id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM posts WHERE id = $1`,
      [id]
    );
    return result[0] || null;
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    const post = await this.findById(id);
    if (!post) throw new NotFoundException('post not found');
    return post;
  }

  async save(post: {
    id?: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }): Promise<string> {
    if (post.id) {
      // update
      await this.dataSource.query(
        `UPDATE posts SET title = $1, short_description = $2, content = $3, blog_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
        [post.title, post.shortDescription, post.content, post.blogId, post.id]
      );
      return post.id.toString();
    } else {
      // insert
      const result = await this.dataSource.query(
        `INSERT INTO posts (title, short_description, content, blog_id, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
        [post.title, post.shortDescription, post.content, post.blogId]
      );
      return result[0].id.toString();
    }
  }

  async getPostsByBlogId(
    blogId: string,
    query: any,
    userId?: string,
  ): Promise<any> {
    const sortByMap: Record<string, string> = {
      createdAt: 'p.created_at',
      title: 'p.title',
    };
    const sortBy = sortByMap[query.sortBy] || 'p.created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;
    const userIdParam = userId || '00000000-0000-0000-0000-000000000000';

    // Получаем посты с информацией о количестве лайков/дизлайков и статусе текущего пользователя
    const postsWithLikes = await this.dataSource.query(
      `SELECT 
         p.*,
         b.name as blog_name,
         COALESCE(SUM(CASE WHEN pl.status = 'Like' THEN 1 ELSE 0 END), 0) AS likes_count,
         COALESCE(SUM(CASE WHEN pl.status = 'Dislike' THEN 1 ELSE 0 END), 0) AS dislikes_count,
         (
           SELECT status FROM post_likes 
           WHERE post_id = p.id AND user_id = $4
         ) AS my_status
       FROM posts p 
       LEFT JOIN blogs b ON p.blog_id = b.id 
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       WHERE p.blog_id = $1
       GROUP BY p.id, b.name  
       ${orderBy} 
       OFFSET $2 LIMIT $3`,
      [blogId, offset, limit, userIdParam]
    );

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM posts WHERE blog_id = $1`,
      [blogId]
    );
    const totalCount = parseInt(countResult[0].count, 10);

    // Получаем три последних лайка для каждого поста
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

    return {
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items: postsWithLikes.map((post: any) => ({
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
          newestLikes: newestLikesByPostId[post.id] || []
        }
      }))
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM posts WHERE id = $1`,
      [id]
    );
  }

  async updateLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatus,
  ): Promise<boolean> {
    // Сначала проверяем, существует ли пост
    await this.findOrNotFoundFail(postId);
    
    // Проверяем, существует ли уже запись о лайке пользователя
    const existingLike = await this.dataSource.query(
      `SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    
    if (likeStatus === 'None' && existingLike.length > 0) {
      // Удаляем оценку, если статус None
      await this.dataSource.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      return true;
    }
    
    if (existingLike.length > 0) {
      // Обновляем существующую оценку
      await this.dataSource.query(
        `UPDATE post_likes 
         SET status = $3, added_at = CURRENT_TIMESTAMP 
         WHERE post_id = $1 AND user_id = $2`,
        [postId, userId, likeStatus]
      );
    } else {
      // Создаем новую оценку
      await this.dataSource.query(
        `INSERT INTO post_likes (id, post_id, user_id, login, status, added_at) 
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [postId, userId, userLogin, likeStatus]
      );
    }
    
    return true;
  }
}
