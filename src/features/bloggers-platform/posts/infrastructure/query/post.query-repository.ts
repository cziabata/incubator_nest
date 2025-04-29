import { NotFoundException } from '@nestjs/common';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

export class PostsQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getById(id: string, userId?: string): Promise<PostViewDto> {
    const result = await this.dataSource.query(
      `SELECT p.*, b.name as blog_name FROM posts p LEFT JOIN blogs b ON p.blog_id = b.id WHERE p.id = $1`,
      [id]
    );
    if (!result[0]) throw new NotFoundException('post not found');
    return PostViewDto.mapToView(result[0], userId);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Здесь можно добавить фильтры по необходимости

    const sortByMap: Record<string, string> = {
      createdAt: 'created_at',
      title: 'title',
    };
    const sortBy = sortByMap[query.sortBy] || 'created_at';
    const orderBy = `ORDER BY ${sortBy} ${query.sortDirection.toUpperCase()}`;
    const where = filter.length ? `WHERE ${filter.join(' AND ')}` : '';
    const offset = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    params.push(offset);
    params.push(limit);

    const items = await this.dataSource.query(
      `SELECT p.*, b.name as blog_name FROM posts p LEFT JOIN blogs b ON p.blog_id = b.id ${where} ${orderBy} OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
      params
    );

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM posts p ${where}`,
      params.slice(0, paramIndex - 1)
    );
    const totalCount = parseInt(countResult[0].count, 10);

    return PaginatedViewDto.mapToView({
      items: items.map((post) => PostViewDto.mapToView(post, userId)),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
