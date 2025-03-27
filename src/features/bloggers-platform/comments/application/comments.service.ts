import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { LikeStatus } from "src/core/dto/likes";
import { UpdateCommentCommand } from "./usecases/update-comment.usecase";
import { DeleteCommentCommand } from "./usecases/delete-comment.usecase";
import { UpdateCommentLikeStatusCommand } from "./usecases/update-comment-like-status.usecase";

@Injectable()
export class CommentsService {
    constructor(
        private commandBus: CommandBus
    ) {}

    async updateComment(commentId: string, content: string): Promise<boolean> {
        return this.commandBus.execute(new UpdateCommentCommand(commentId, content));
    }

    async deleteComment(commentId: string): Promise<void> {
        return this.commandBus.execute(new DeleteCommentCommand(commentId));
    }

    async updateCommentLikeStatus(commentId: string, userId: string, likeStatus: LikeStatus): Promise<void> {
        return this.commandBus.execute(new UpdateCommentLikeStatusCommand(
            commentId,
            userId,
            likeStatus
        ));
    }
} 