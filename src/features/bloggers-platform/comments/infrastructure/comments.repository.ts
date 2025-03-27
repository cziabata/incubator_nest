import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentModelType } from '../domain/comment.entity';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType
  ) {}

  async findById(id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id: id,
    });
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new NotFoundException('comment not found');
    }

    return comment;
  }

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    const comment = await this.findOrNotFoundFail(commentId);
    comment.content = content;
    await this.save(comment);
    return true;
  }

  async createComment(
    content: string,
    postId: string,
    userId: string,
    userLogin: string
  ): Promise<CommentDocument> {
    const newComment = new this.CommentModel({
      content,
      postId,
      commentatorInfo: {
        userId,
        userLogin,
      },
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
      likes: []
    });

    await this.save(newComment);
    return newComment;
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.CommentModel.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Comment not found');
    }
  }

  async updateLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus
  ): Promise<boolean> {
    const comment = await this.findOrNotFoundFail(commentId);
    
    // Найдем существующий лайк пользователя
    const existingLikeIndex = comment.likes.findIndex(like => like.userId === userId);
    const hasExistingLike = existingLikeIndex !== -1;
    
    // Определим старый статус
    const oldStatus = hasExistingLike ? comment.likes[existingLikeIndex].status : 'None';
    
    // Если статус не изменился, ничего не делаем
    if (oldStatus === likeStatus) {
      return true;
    }
    
    // Обновим счетчики лайков/дизлайков
    if (oldStatus === 'Like') {
      comment.likesInfo.likesCount -= 1;
    } else if (oldStatus === 'Dislike') {
      comment.likesInfo.dislikesCount -= 1;
    }
    
    if (likeStatus === 'Like') {
      comment.likesInfo.likesCount += 1;
    } else if (likeStatus === 'Dislike') {
      comment.likesInfo.dislikesCount += 1;
    }
    
    // Обновим или добавим лайк в массив
    if (likeStatus === 'None') {
      // Если новый статус "None", удаляем лайк из массива
      if (hasExistingLike) {
        comment.likes.splice(existingLikeIndex, 1);
      }
    } else {
      // Обновляем существующий или добавляем новый лайк
      if (hasExistingLike) {
        comment.likes[existingLikeIndex].status = likeStatus;
        comment.likes[existingLikeIndex].createdAt = new Date();
      } else {
        comment.likes.push({
          userId: userId,
          status: likeStatus,
          createdAt: new Date()
        });
      }
    }
    
    await this.save(comment);
    return true;
  }
}