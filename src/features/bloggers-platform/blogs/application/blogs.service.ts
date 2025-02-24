import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blogs.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog = this.BlogModel.createInstance(dto);

    await this.blogsRepository.save(blog);

    return blog.id;
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<string> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    blog.updateBlog(dto);

    await this.blogsRepository.save(blog);

    return blog._id.toString();
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteById(id);
  }

  async getPostsByBlogId(blogId: string, query: GetPostsQueryParams) {
    try {
      await this.blogsRepository.findOrNotFoundFail(blogId);
      return await this.postsRepository.getPostsByBlogId(blogId, query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }
}
