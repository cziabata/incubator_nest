import { BlogDocument } from '../../domain/blog.entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;

  static mapToView(blog: any): BlogViewDto {
    const dto = new BlogViewDto();
    dto.id = blog.id?.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.website_url;
    dto.isMembership = blog.is_membership;
    dto.createdAt = blog.created_at;
    return dto;
  }
}
