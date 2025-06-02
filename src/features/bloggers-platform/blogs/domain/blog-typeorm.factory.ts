import { BlogTypeOrm } from './blog-typeorm.entity';
import { CreateBlogTypeOrmDto } from './types/blog-typeorm.types';

export class BlogTypeOrmFactory {
  static createBlog(dto: CreateBlogTypeOrmDto): BlogTypeOrm {
    const blog = new BlogTypeOrm();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;
    
    return blog;
  }

  static updateBlog(blog: BlogTypeOrm, dto: CreateBlogTypeOrmDto): BlogTypeOrm {
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    
    return blog;
  }
} 