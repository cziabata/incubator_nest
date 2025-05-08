import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CreateBlogDto } from "../../dto/blogs.dto";
import { BlogsRepository } from "../../infrastructure/blogs.repository";

export class CreateBlogUsecaseCommand {
    constructor(
        public dto: CreateBlogDto
    ) {}
}

@CommandHandler(CreateBlogUsecaseCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogUsecaseCommand, string> {
  constructor(
    private blogsRepository: BlogsRepository,
  ) {}
  async execute(command: CreateBlogUsecaseCommand): Promise<string> {
    const dto = command.dto;
    const blog = {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      isMembership: false,
    };
    const blogId = await this.blogsRepository.save(blog);
    return blogId;
  }
}
