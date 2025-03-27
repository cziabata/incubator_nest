import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CommentsRepository } from "../../infrastructure/comments.repository";

export class UpdateCommentCommand {
    constructor(
        public commentId: string,
        public content: string
    ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
    constructor(
        private commentsRepository: CommentsRepository,
    ) {}
    
    async execute(command: UpdateCommentCommand): Promise<boolean> {
        return this.commentsRepository.updateComment(command.commentId, command.content);
    }
} 