import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { GetPostsQueryParams } from '../../../posts/api/input-dto/get-posts-query-params.input-dto';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../../posts/api/view-dto/posts.view-dto';

export class GetBlogPostsQuery {
  constructor(
    public blogId: string,
    public query: GetPostsQueryParams,
    public userId?: string,
  ) {}
}

@QueryHandler(GetBlogPostsQuery)
@Injectable()
export class GetBlogPostsUseCase implements IQueryHandler<GetBlogPostsQuery> {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute(
    query: GetBlogPostsQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    try {
      await this.blogsRepository.findOrNotFoundFail(query.blogId);
      return await this.postsRepository.getPostsByBlogId(
        query.blogId,
        query.query,
        query.userId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }
}
