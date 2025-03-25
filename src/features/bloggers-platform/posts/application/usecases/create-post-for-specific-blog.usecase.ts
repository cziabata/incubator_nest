import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { InjectModel } from "@nestjs/mongoose";
import { Post, PostModelType } from "../../domain/post.entity";
import { CreatePostForSpecificBlogDto } from "../../dto/posts.dto";
import { PostsRepository } from "../../infrastructure/posts.repository";
import { BlogsQueryRepository } from "../../../blogs/infrastructure/query/blogs.query-repository";
import { CreatePostDomainDto } from "../../domain/dto/create-post.domain.dto";

export class CreatePostForSpecificBlogCommand {
    constructor(
        public blogId: string,
        public dto: CreatePostForSpecificBlogDto
    ) {}
}

@CommandHandler(CreatePostForSpecificBlogCommand)
export class CreatePostForSpecificBlogUseCase implements ICommandHandler<CreatePostForSpecificBlogCommand> {
    constructor(
        @InjectModel(Post.name)
        private PostModel: PostModelType,
        private postsRepository: PostsRepository,
        private blogsQueryRepository: BlogsQueryRepository,
    ) {}

    async execute(command: CreatePostForSpecificBlogCommand): Promise<string> {
        const relatedBlog = await this.blogsQueryRepository.getById(command.blogId);

        const prepareNewPostDto: CreatePostDomainDto = {
            title: command.dto.title,
            shortDescription: command.dto.shortDescription,
            content: command.dto.content,
            blogId: command.blogId,
            blogName: relatedBlog.name,
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: 'None',
                newestLikes: [],
            },
        };
        const post = this.PostModel.createInstance(prepareNewPostDto);

        await this.postsRepository.save(post);

        return post.id;
    }
} 