import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { BlogsRepository } from "../../infrastructure/blogs.repository";

export class DeleteBlogCommand {
    constructor(
        public id: string
    ) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
    constructor(
        private blogsRepository: BlogsRepository,
    ) {}

    async execute(command: DeleteBlogCommand): Promise<void> {
        await this.blogsRepository.deleteById(command.id);
    }
} 