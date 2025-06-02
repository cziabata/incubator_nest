import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostTypeOrm } from '../../domain/post-typeorm.entity';
import { PostLikeTypeOrm } from '../../domain/post-like-typeorm.entity';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { ExtendedLikesInfoTypeOrm, NewestLikeTypeOrm } from '../../domain/types/post-typeorm.types';
import { LikeStatus } from 'src/core/dto/likes';

@Injectable()
export class PostsTypeOrmQueryRepository {
  constructor(
    @InjectRepository(PostTypeOrm)
    private postsRepository: Repository<PostTypeOrm>,
    @InjectRepository(PostLikeTypeOrm)
    private postLikesRepository: Repository<PostLikeTypeOrm>
  ) {}

  async getById(id: string, userId?: string): Promise<PostViewDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['blog']
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const extendedLikesInfo = await this.getExtendedLikesInfo(id, userId);
    return this.mapToView(post, extendedLikesInfo);
  }

  async getAll(query: GetPostsQueryParams, userId?: string): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog');

    // Apply sorting
    const sortByMap: Record<string, string> = {
      createdAt: 'post.createdAt',
      title: 'post.title',
      blogName: 'blog.name',
    };
    const sortBy = sortByMap[query.sortBy] || 'post.createdAt';
    queryBuilder.orderBy(sortBy, query.sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    // Get extended likes info for all posts
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const extendedLikesInfo = await this.getExtendedLikesInfo(post.id, userId);
        return this.mapToView(post, extendedLikesInfo);
      })
    );

    return PaginatedViewDto.mapToView({
      items: postsWithLikes,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getPostsByBlogId(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .where('post.blogId = :blogId', { blogId });

    // Apply sorting
    const sortByMap: Record<string, string> = {
      createdAt: 'post.createdAt',
      title: 'post.title',
      blogName: 'blog.name',
    };
    const sortBy = sortByMap[query.sortBy] || 'post.createdAt';
    queryBuilder.orderBy(sortBy, query.sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    // Get extended likes info for all posts
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const extendedLikesInfo = await this.getExtendedLikesInfo(post.id, userId);
        return this.mapToView(post, extendedLikesInfo);
      })
    );

    return PaginatedViewDto.mapToView({
      items: postsWithLikes,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private async getExtendedLikesInfo(postId: string, userId?: string): Promise<ExtendedLikesInfoTypeOrm> {
    // Get likes and dislikes count
    const likesCount = await this.postLikesRepository.count({
      where: { postId, status: 'Like' }
    });
    
    const dislikesCount = await this.postLikesRepository.count({
      where: { postId, status: 'Dislike' }
    });

    // Get user's status
    let myStatus: LikeStatus = 'None';
    if (userId) {
      const userLike = await this.postLikesRepository.findOne({
        where: { postId, userId }
      });
      myStatus = userLike?.status || 'None';
    }

    // Get newest likes (last 3)
    const newestLikes = await this.postLikesRepository.find({
      where: { postId, status: 'Like' },
      order: { addedAt: 'DESC' },
      take: 3
    });

    const newestLikesFormatted: NewestLikeTypeOrm[] = newestLikes.map(like => ({
      userId: like.userId,
      login: like.login,
      addedAt: like.addedAt
    }));

    return {
      likesCount,
      dislikesCount,
      myStatus,
      newestLikes: newestLikesFormatted
    };
  }

  private mapToView(post: PostTypeOrm, extendedLikesInfo: ExtendedLikesInfoTypeOrm): PostViewDto {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blog.name,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: extendedLikesInfo.likesCount,
        dislikesCount: extendedLikesInfo.dislikesCount,
        myStatus: extendedLikesInfo.myStatus,
        newestLikes: extendedLikesInfo.newestLikes.map(like => ({
          userId: like.userId,
          login: like.login,
          addedAt: like.addedAt
        }))
      }
    };
  }
} 