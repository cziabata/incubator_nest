import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { Comment } from '../../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
    @InjectModel(Comment.name) private CommentModel: Model<Comment>,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    // Создаем новый комментарий
    const comment = new this.CommentModel({
      content: command.dto.content,
      commentatorInfo: command.dto.commentatorInfo,
      postId: command.dto.postId,
      createdAt: new Date().toISOString(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    });

    // Сохраняем комментарий
    await this.commentsRepository.save(comment);

    return comment._id.toString();
  }
} 