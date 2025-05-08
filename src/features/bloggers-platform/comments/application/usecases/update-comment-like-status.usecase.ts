import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CommentsRepository } from "../../infrastructure/comments.repository";
import { LikeStatus } from "src/core/dto/likes";
import { BadRequestException, NotFoundException } from "@nestjs/common";

export class UpdateCommentLikeStatusCommand {
    constructor(
        public commentId: string,
        public userId: string,
        public likeStatus: LikeStatus
    ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<UpdateCommentLikeStatusCommand> {
    constructor(
        private commentsRepository: CommentsRepository
    ) {}
    
    async execute(command: UpdateCommentLikeStatusCommand): Promise<void> {
        const { commentId, userId, likeStatus } = command;
        
        try {
            // Проверка существования комментария и обновление статуса лайка
            await this.commentsRepository.findOrNotFoundFail(commentId);
            const result = await this.commentsRepository.updateLikeStatus(commentId, userId, likeStatus);
            
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