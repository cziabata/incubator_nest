import { NotFoundException } from '@nestjs/common';
import { BlogViewDto } from '../../api/view-dto/blogs.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';

export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getById(id: string): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
    });

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<Blog> = {};

    if (query.searchNameTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        name: { $regex: query.searchNameTerm, $options: 'i' },
      });
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = blogs.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
