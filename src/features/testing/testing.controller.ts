import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { User, UserModelType } from '../user-accounts/domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  Post,
  PostModelType,
} from '../bloggers-platform/posts/domain/post.entity';
import {
  Blog,
  BlogModelType,
} from '../bloggers-platform/blogs/domain/blog.entity';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAll() {
    this.UserModel.deleteMany();
    this.PostModel.deleteMany();
    this.BlogModel.deleteMany();
  }
}
