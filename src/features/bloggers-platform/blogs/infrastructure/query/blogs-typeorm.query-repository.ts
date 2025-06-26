import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogTypeOrm } from '../../domain/blog-typeorm.entity';
import { BlogViewDto } from '../../api/view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class BlogsTypeOrmQueryRepository {
  constructor(
    @InjectRepository(BlogTypeOrm)
    private blogsRepository: Repository<BlogTypeOrm>
  ) {}

  async getById(id: string): Promise<BlogViewDto> {
    const blog = await this.blogsRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return this.mapToView(blog);
  }

  async getAll(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryBuilder = this.blogsRepository.createQueryBuilder('blog');

    // Apply search filter
    if (query.searchNameTerm) {
      queryBuilder.where('blog.name ILIKE :searchTerm', {
        searchTerm: `%${query.searchNameTerm}%`
      });
    }

    // Apply sorting
    const sortByMap: Record<string, string> = {
      createdAt: 'blog.createdAt',
      name: 'blog.name',
    };
    const sortBy = sortByMap[query.sortBy] || 'blog.createdAt';
    queryBuilder.orderBy(sortBy, query.sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    return PaginatedViewDto.mapToView({
      items: items.map(blog => this.mapToView(blog)),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private mapToView(blog: BlogTypeOrm): BlogViewDto {
    const dto = new BlogViewDto();
    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.isMembership = blog.isMembership;
    dto.createdAt = blog.createdAt;
    return dto;
  }
} 