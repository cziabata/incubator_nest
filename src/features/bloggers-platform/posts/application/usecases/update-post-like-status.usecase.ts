import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { PostsRepository } from "../../infrastructure/posts.repository";
import { LikeStatus } from "src/core/dto/likes";
import { NotFoundException, BadRequestException } from "@nestjs/common";

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
        private postsRepository: PostsRepository
    ) {}
    
    async execute(command: UpdatePostLikeStatusCommand): Promise<void> {
        const { postId, userId, userLogin, likeStatus } = command;
        
        try {
            // Проверка существования поста и обновление статуса лайка
            await this.postsRepository.findOrNotFoundFail(postId);
            const result = await this.postsRepository.updateLikeStatus(postId, userId, userLogin, likeStatus);
            
            if (!result) {
                throw new BadRequestException('Failed to update like status');
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to update like status');
        }
    }
} 