import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { UpdateBlogDto } from "../../dto/blogs.dto";
import { BlogsRepository } from "../../infrastructure/blogs.repository";

export class UpdateBlogCommand {
    constructor(
        public id: string,
        public dto: UpdateBlogDto
    ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
    constructor(
        private blogsRepository: BlogsRepository,
    ) {}

    async execute(command: UpdateBlogCommand): Promise<void> {
        const blog = await this.blogsRepository.findOrNotFoundFail(command.id);

        blog.updateBlog(command.dto);

        await this.blogsRepository.save(blog);
    }
} 