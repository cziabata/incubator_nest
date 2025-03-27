import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CommentsRepository } from "../../infrastructure/comments.repository";

export class DeleteCommentCommand {
    constructor(
        public commentId: string
    ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentCommand> {
    constructor(
        private commentsRepository: CommentsRepository,
    ) {}
    
    async execute(command: DeleteCommentCommand): Promise<void> {
        await this.commentsRepository.deleteById(command.commentId);
    }
} 