import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { PostsRepository } from "../../infrastructure/posts.repository";
import { BlogsQueryRepository } from "../../../blogs/infrastructure/query/blogs.query-repository";
import { CreatePostForSpecificBlogDto } from "../../dto/posts.dto";

export class CreatePostForSpecificBlogCommand {
    constructor(
        public blogId: string,
        public dto: CreatePostForSpecificBlogDto
    ) {}
}

@CommandHandler(CreatePostForSpecificBlogCommand)
export class CreatePostForSpecificBlogUseCase implements ICommandHandler<CreatePostForSpecificBlogCommand> {
    constructor(
        private postsRepository: PostsRepository,
        private blogsQueryRepository: BlogsQueryRepository,
    ) {}

    async execute(command: CreatePostForSpecificBlogCommand): Promise<string> {
        const relatedBlog = await this.blogsQueryRepository.getById(command.blogId);

        const post = {
            title: command.dto.title,
            shortDescription: command.dto.shortDescription,
            content: command.dto.content,
            blogId: command.blogId,
            blogName: relatedBlog.name,
        };
        const postId = await this.postsRepository.save(post);
        return postId;
    }
} 