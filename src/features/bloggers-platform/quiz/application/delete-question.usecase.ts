import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { QuestionTypeOrmRepository } from "../infrastructure/question-typeorm.repository";

export class DeleteQuestionUsecaseCommand {
    constructor(
        public id: string,
    ) {}
}

@CommandHandler(DeleteQuestionUsecaseCommand)
export class DeleteQuestionUseCase implements ICommandHandler<DeleteQuestionUsecaseCommand> {
  constructor(
    private questionRepository: QuestionTypeOrmRepository,
  ) {}
  async execute(command: DeleteQuestionUsecaseCommand): Promise<void> {
    await this.questionRepository.deleteById(command.id);
  }
}