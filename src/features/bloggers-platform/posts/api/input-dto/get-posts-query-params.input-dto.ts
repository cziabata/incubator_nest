import { BaseSortablePaginationParams } from 'src/core/dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by';

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  sortBy = PostsSortBy.CreatedAt;
}
