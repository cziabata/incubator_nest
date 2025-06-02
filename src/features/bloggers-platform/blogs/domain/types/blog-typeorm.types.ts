export interface CreateBlogTypeOrmDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface UpdateBlogTypeOrmDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface BlogTypeOrmInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
} 