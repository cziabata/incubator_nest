import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { GetPostsQueryParams } from '../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from '../api/view-dto/posts.view-dto';
import { FilterQuery } from 'mongoose';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
    });
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);

    if (!post) {
      //TODO: replace with domain exception
      throw new NotFoundException('post not found');
    }

    return post;
  }

  async save(post: PostDocument) {
    await post.save();
  }

  async getPostsByBlogId(
    blogId: string,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = { blogId };
    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map(PostViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.PostModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Blog not found');
    }
  }

  async updateLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatus
  ): Promise<boolean> {
    const post = await this.findOrNotFoundFail(postId);
    
    // Найдем существующий лайк пользователя
    const existingLikeIndex = post.likes.findIndex(like => like.userId === userId);
    const hasExistingLike = existingLikeIndex !== -1;
    
    // Определим старый статус
    const oldStatus = hasExistingLike ? post.likes[existingLikeIndex].status : 'None';
    
    // Если статус не изменился, ничего не делаем
    if (oldStatus === likeStatus) {
      return true;
    }
    
    // Обновим счетчики лайков/дизлайков
    if (oldStatus === 'Like') {
      post.likesInfo.likesCount -= 1;
    } else if (oldStatus === 'Dislike') {
      post.likesInfo.dislikesCount -= 1;
    }
    
    if (likeStatus === 'Like') {
      post.likesInfo.likesCount += 1;
    } else if (likeStatus === 'Dislike') {
      post.likesInfo.dislikesCount += 1;
    }
    
    // Обновим или добавим лайк в массив
    if (likeStatus === 'None') {
      // Если новый статус "None", удаляем лайк из массива
      if (hasExistingLike) {
        post.likes.splice(existingLikeIndex, 1);
        
        // Удалим из списка последних лайков
        post.newestLikes = post.newestLikes.filter(like => like.userId !== userId);
      }
    } else {
      const currentDate = new Date();
      
      // Обновляем существующий или добавляем новый лайк
      if (hasExistingLike) {
        post.likes[existingLikeIndex].status = likeStatus;
        post.likes[existingLikeIndex].addedAt = currentDate;
      } else {
        post.likes.push({
          userId,
          login: userLogin,
          status: likeStatus,
          addedAt: currentDate
        });
      }
      
      // Обновляем список последних лайков только для статуса "Like"
      if (likeStatus === 'Like') {
        // Удалим старую запись пользователя из списка последних лайков, если она есть
        post.newestLikes = post.newestLikes.filter(like => like.userId !== userId);
        
        // Добавим новый лайк в список
        post.newestLikes.push({
          addedAt: currentDate,
          userId,
          login: userLogin
        });
        
        // Сортируем по дате и оставляем только последние 3
        post.newestLikes.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        post.newestLikes = post.newestLikes.slice(0, 3);
      }
    }
    
    await this.save(post);
    return true;
  }
}
