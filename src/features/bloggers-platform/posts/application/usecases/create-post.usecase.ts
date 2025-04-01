import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { InjectModel } from "@nestjs/mongoose";
import { Post, PostModelType } from "../../domain/post.entity";
import { CreatePostDto } from "../../dto/posts.dto";
import { PostsRepository } from "../../infrastructure/posts.repository";
import { BlogsQueryRepository } from "../../../blogs/infrastructure/query/blogs.query-repository";
import { CreatePostDomainDto } from "../../domain/dto/create-post.domain.dto";
import { NotFoundException } from "@nestjs/common";

export class CreatePostCommand {
    constructor(
        public dto: CreatePostDto
    ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
    constructor(
        @InjectModel(Post.name)
        private PostModel: PostModelType,
        private postsRepository: PostsRepository,
        private blogsQueryRepository: BlogsQueryRepository,
    ) {}

    async execute(command: CreatePostCommand): Promise<string> {
        // Проверяем существование блога
        const relatedBlog = await this.blogsQueryRepository.getById(command.dto.blogId);
        if (!relatedBlog) {
            throw new NotFoundException('Blog not found');
        }

        const prepareNewPostDto: CreatePostDomainDto = {
            title: command.dto.title,
            shortDescription: command.dto.shortDescription,
            content: command.dto.content,
            blogId: command.dto.blogId,
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