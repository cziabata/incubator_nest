import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findById(id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM blogs WHERE id = $1`,
      [id]
    );
    return result[0] || null;
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    const blog = await this.findById(id);
    if (!blog) throw new NotFoundException('blog not found');
    return blog;
  }

  async save(blog: {
    id?: string;
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
  }): Promise<string> {
    if (blog.id) {
      // update
      await this.dataSource.query(
        `UPDATE blogs SET name = $1, description = $2, website_url = $3, is_membership = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
        [blog.name, blog.description, blog.websiteUrl, blog.isMembership, blog.id]
      );
      return blog.id;
    } else {
      // insert
      const result = await this.dataSource.query(
        `INSERT INTO blogs (name, description, website_url, is_membership, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
        [blog.name, blog.description, blog.websiteUrl, blog.isMembership]
      );
      return result[0].id;
    }
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.dataSource.query(
      `DELETE FROM blogs WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) throw new NotFoundException('Blog not found');
  }
}
