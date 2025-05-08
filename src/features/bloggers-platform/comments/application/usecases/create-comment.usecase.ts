import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';

export class CreateCommentCommand {
  constructor(
    public readonly dto: {
      content: string;
      commentatorInfo: {
        userId: string;
        userLogin: string;
      };
      postId: string;
    },
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    // Создаем новый комментарий
    const comment = await this.commentsRepository.createComment(
      command.dto.content,
      command.dto.postId,
      command.dto.commentatorInfo.userId,
      command.dto.commentatorInfo.userLogin
    );

    return comment.id;
  }
} 