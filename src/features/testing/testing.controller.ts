import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
// import { User, UserModelType } from '../user-accounts/domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  Post,
  PostModelType,
} from '../bloggers-platform/posts/domain/post.entity';
import {
  Blog,
  BlogModelType,
} from '../bloggers-platform/blogs/domain/blog.entity';
import {
  Comment,
  CommentModelType,
} from '../bloggers-platform/comments/domain/comment.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    // @InjectModel(User.name)
    // private UserModel: UserModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    // await this.UserModel.deleteMany();
    await this.PostModel.deleteMany();
    await this.BlogModel.deleteMany();
    await this.CommentModel.deleteMany();
    
    // Очистка таблиц через SQL
    await this.dataSource.query(`TRUNCATE TABLE users`);
    await this.dataSource.query(`TRUNCATE TABLE refresh_tokens_black_list`);
    await this.dataSource.query(`TRUNCATE TABLE sessions`);
  }
}
