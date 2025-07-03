import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionViewDto } from '../../api/view-dto/questions.view-dto';
import { GetQuestionsQueryParams } from '../../api/input-dto/get-questions-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { QuestionTypeOrm } from '../../domain/question-typeorm.entity';
import { QuestionSearchStatuses } from '../../dto/question-search-statuses';

@Injectable()
export class QuestionTypeOrmQueryRepository {
  constructor(
    @InjectRepository(QuestionTypeOrm)
    private questionsRepository: Repository<QuestionTypeOrm>,
  ) {}

  async getById(id: string): Promise<QuestionViewDto> {
    const question = await this.questionsRepository.findOne({ where: { id: Number(id) } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return this.mapToView(question);
  }

  async getAll(
    query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const queryBuilder =
      this.questionsRepository.createQueryBuilder('question');

    // Apply search filter
    if (query.bodySearchTerm) {
      queryBuilder.andWhere('question.body ILIKE :searchTerm', {
        searchTerm: `%${query.bodySearchTerm}%`,
      });
    }

    if (query.publishedStatus) {
      queryBuilder.andWhere('question.published = :published', {
        published: query.publishedStatus === QuestionSearchStatuses.PUBLISHED,
      });
    }

    // Apply sorting
    const sortByMap: Record<string, string> = {
      createdAt: 'question.created_at',
      body: 'question.body',
    };
    const sortBy = sortByMap[query.sortBy] || 'question.created_at';
    queryBuilder.orderBy(
      sortBy,
      query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
    );

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    return PaginatedViewDto.mapToView({
      items: items.map((question) => this.mapToView(question)),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private mapToView(question: QuestionTypeOrm): QuestionViewDto {
    const dto = new QuestionViewDto();
    dto.id = question.id.toString();
    dto.body = question.body;
    dto.answers = JSON.parse(question.answers);
    dto.published = question.published;
    dto.createdAt = question.createdAt;
    dto.updatedAt = question.updatedAt;
    return dto;
  }
}
