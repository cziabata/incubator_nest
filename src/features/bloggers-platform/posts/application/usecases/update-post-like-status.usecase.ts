import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { PostsRepository } from "../../infrastructure/posts.repository";
import { LikeStatus } from "src/core/dto/likes";
import { NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Post, PostModelType } from "../../domain/post.entity";

export class UpdatePostLikeStatusCommand {
    constructor(
        public postId: string,
        public userId: string,
        public userLogin: string,
        public likeStatus: LikeStatus
    ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase implements ICommandHandler<UpdatePostLikeStatusCommand> {
    constructor(
        private postsRepository: PostsRepository,
        @InjectModel(Post.name) private PostModel: PostModelType
    ) {}
    
    async execute(command: UpdatePostLikeStatusCommand): Promise<void> {
        const { postId, userId, userLogin, likeStatus } = command;
        
        // Проверка существования поста
        const post = await this.PostModel.findOne({ _id: postId });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        
        // Обновление статуса лайка
        await this.postsRepository.updateLikeStatus(postId, userId, userLogin, likeStatus);
    }
} 