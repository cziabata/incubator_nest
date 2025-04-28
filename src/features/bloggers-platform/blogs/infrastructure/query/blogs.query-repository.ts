import { NotFoundException } from '@nestjs/common';
import { BlogViewDto } from '../../api/view-dto/blogs.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

export class BlogsQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getById(id: string): Promise<BlogViewDto> {
    const result = await this.dataSource.query(
      `SELECT * FROM blogs WHERE id = $1`,
      [id]
    );
    if (!result[0]) throw new NotFoundException('blog not found');
    return BlogViewDto.mapToView(result[0]);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (query.searchNameTerm) {
      filter.push(`name ILIKE $${paramIndex}`);
      params.push(`%${query.searchNameTerm}%`);
      paramIndex++;
    }

    const sortByMap: Record<string, string> = {
      createdAt: 'created_at',
      name: 'name',
    };
    const sortBy = sortByMap[query.sortBy] || 'created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const where = filter.length ? `WHERE ${filter.join(' AND ')}` : '';
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    params.push(offset);
    params.push(limit);

    const items = await this.dataSource.query(
      `SELECT * FROM blogs ${where} ${orderBy} OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
      params
    );

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM blogs ${where}`,
      params.slice(0, paramIndex - 1)
    );
    const totalCount = parseInt(countResult[0].count, 10);

    return PaginatedViewDto.mapToView({
      items: items.map(BlogViewDto.mapToView),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
