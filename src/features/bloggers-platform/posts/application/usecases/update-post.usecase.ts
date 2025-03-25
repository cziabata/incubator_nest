import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { UpdatePostDto } from "../../dto/posts.dto";
import { PostsRepository } from "../../infrastructure/posts.repository";

export class UpdatePostCommand {
    constructor(
        public id: string,
        public dto: UpdatePostDto
    ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
    constructor(
        private postsRepository: PostsRepository,
    ) {}
    
    async execute(command: UpdatePostCommand): Promise<void> {
        const post = await this.postsRepository.findOrNotFoundFail(command.id);

        post.updatePost(command.dto);

        await this.postsRepository.save(post);
    }
} 