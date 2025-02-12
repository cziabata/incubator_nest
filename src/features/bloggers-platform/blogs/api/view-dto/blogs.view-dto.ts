import { BlogDocument } from '../../domain/blog.entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;

  static mapToView(blog: BlogDocument): BlogViewDto {
    const dto = new BlogViewDto();

    dto.name = blog.name;
    dto.description = blog.description;
    dto.id = blog._id.toString();
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;
    dto.websiteUrl = blog.websiteUrl;

    return dto;
  }
}
