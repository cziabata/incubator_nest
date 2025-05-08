import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async findById(id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM comments WHERE id = $1`,
      [id]
    );
    return result[0] || null;
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new NotFoundException('comment not found');
    }

    return comment;
  }

  async save(comment: any) {
    if (comment.id) {
      // Обновление существующего комментария
      await this.dataSource.query(
        `UPDATE comments 
         SET content = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [comment.content, comment.id]
      );
      return comment.id;
    } else {
      // Создание нового комментария
      const result = await this.dataSource.query(
        `INSERT INTO comments 
         (id, content, post_id, user_id, user_login, created_at, updated_at) 
         VALUES 
         (uuid_generate_v4(), $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id`,
        [comment.content, comment.postId, comment.commentatorInfo.userId, comment.commentatorInfo.userLogin]
      );
      return result[0].id;
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [content, commentId]
    );
    
    return result.rowCount > 0;
  }

  async createComment(
    content: string,
    postId: string,
    userId: string,
    userLogin: string
  ): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO comments 
       (id, content, post_id, user_id, user_login, created_at, updated_at) 
       VALUES 
       (uuid_generate_v4(), $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, content, post_id, user_id, user_login, created_at`,
      [content, postId, userId, userLogin]
    );
    
    const newComment = result[0];
    return {
      id: newComment.id,
      content: newComment.content,
      postId: newComment.post_id,
      commentatorInfo: {
        userId: newComment.user_id,
        userLogin: newComment.user_login
      },
      createdAt: newComment.created_at,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None'
      }
    };
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.dataSource.query(
      `DELETE FROM comments WHERE id = $1`,
      [id]
    );
    
    if (result.rowCount === 0) {
      throw new NotFoundException('Comment not found');
    }
  }

  async updateLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus
  ): Promise<boolean> {
    // Сначала проверяем, существует ли комментарий
    await this.findOrNotFoundFail(commentId);
    
    // Проверяем, существует ли уже запись о лайке пользователя
    const existingLike = await this.dataSource.query(
      `SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );
    
    if (likeStatus === 'None' && existingLike.length > 0) {
      // Удаляем оценку, если статус None
      await this.dataSource.query(
        `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId]
      );
      return true;
    }
    
    if (existingLike.length > 0) {
      // Обновляем существующую оценку
      await this.dataSource.query(
        `UPDATE comment_likes 
         SET status = $3, created_at = CURRENT_TIMESTAMP 
         WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId, likeStatus]
      );
    } else {
      // Создаем новую оценку
      await this.dataSource.query(
        `INSERT INTO comment_likes (id, comment_id, user_id, status, created_at) 
         VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP)`,
        [commentId, userId, likeStatus]
      );
    }
    
    return true;
  }
}