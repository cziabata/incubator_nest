import { BaseSortablePaginationParams } from '../../../../../core/dto/base.query-params.input-dto';
import { QuestionSearchStatuses } from '../../dto/question-search-statuses';
import { QuestionsSortBy } from './questions-sort-by';

export class GetQuestionsQueryParams extends BaseSortablePaginationParams<QuestionsSortBy> {
  sortBy = QuestionsSortBy.CreatedAt;
  bodySearchTerm: string | null = null;
  publishedStatus: QuestionSearchStatuses | null = null;
}