import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/query/blogs.query-repository';
import { CreatePostDto } from '../../dto/posts.dto';
import { NotFoundException } from '@nestjs/common';

export class CreatePostCommand {
  constructor(public dto: CreatePostDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private postsRepository: PostsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    // Проверяем существование блога
    const relatedBlog = await this.blogsQueryRepository.getById(
      command.dto.blogId,
    );
    if (!relatedBlog) {
      throw new NotFoundException('Blog not found');
    }

    const post = {
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.dto.blogId,
      blogName: relatedBlog.name,
    };
    const postId = await this.postsRepository.save(post);
    return postId;
  }
}
