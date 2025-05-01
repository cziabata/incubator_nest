import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
      createdAt: 'created_at',
      title: 'title',
    };
    const sortBy = sortByMap[query.sortBy] || 'created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    const items = await this.dataSource.query(
      `SELECT p.*, b.name as blog_name 
       FROM posts p 
       LEFT JOIN blogs b ON p.blog_id = b.id 
       WHERE p.blog_id = $1 
       ${orderBy} 
       OFFSET $2 LIMIT $3`,
      [blogId, offset, limit]
    );

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM posts WHERE blog_id = $1`,
      [blogId]
    );
    const totalCount = parseInt(countResult[0].count, 10);

    return {
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items: items.map((post: any) => ({
        id: post.id,
        title: post.title,
        shortDescription: post.short_description,
        content: post.content,
        blogId: post.blog_id,
        blogName: post.blog_name,
        createdAt: post.created_at,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: []
        }
      }))
    };
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.dataSource.query(
      `DELETE FROM posts WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) throw new NotFoundException('Post not found');
  }

  // --- Likes and comments logic is temporarily disabled for future SQL migration ---
  /*
  async updateLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatus,
  ): Promise<boolean> {
    // ... existing like logic ...
  }
  */
}
