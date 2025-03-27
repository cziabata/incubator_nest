import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CommentsRepository } from "../../infrastructure/comments.repository";
import { LikeStatus } from "src/core/dto/likes";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentModelType } from "../../domain/comment.entity";

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
        private commentsRepository: CommentsRepository,
        @InjectModel(Comment.name) private CommentModel: CommentModelType
    ) {}
    
    async execute(command: UpdateCommentLikeStatusCommand): Promise<void> {
        const { commentId, userId, likeStatus } = command;
        
        // Проверка существования комментария
        const comment = await this.CommentModel.findOne({ _id: commentId });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        
        // Поиск существующего лайка
        const existingLikeIndex = comment.likes.findIndex(like => like.userId === userId);
        const hasExistingLike = existingLikeIndex !== -1;
        
        // Определение текущего статуса
        const currentStatus = hasExistingLike ? comment.likes[existingLikeIndex].status : 'None';
        
        // Если статус не изменился, ничего не делаем
        if (currentStatus === likeStatus) {
            return;
        }
        
        // Обновляем статус лайка
        const result = await this.commentsRepository.updateLikeStatus(commentId, userId, likeStatus);
        
        if (!result) {
            throw new BadRequestException('Failed to update like status');
        }
    }
} 