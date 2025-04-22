import { BaseSortablePaginationParams, SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';

export class GetUsersQueryParams extends BaseSortablePaginationParams<UsersSortBy> {
  sortBy = UsersSortBy.Id;
  sortDirection = SortDirection.Desc;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}
