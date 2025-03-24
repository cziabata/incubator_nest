import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CreateBlogDto } from "../../dto/blogs.dto";
import { Blog } from "../../domain/blog.entity";
import { BlogsRepository } from "../../infrastructure/blogs.repository";
import { BlogModelType } from "../../domain/blog.entity";
import { InjectModel } from "@nestjs/mongoose";


export class CreateBlogUsecaseCommand {
    constructor(
        public dto: CreateBlogDto
    ) {}
}

@CommandHandler(CreateBlogUsecaseCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogUsecaseCommand, string> {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}
    async execute(command: CreateBlogUsecaseCommand): Promise<string> {
    const blog = this.BlogModel.createInstance(command.dto);

    await this.blogsRepository.save(blog);

    return blog.id;
  }
}
