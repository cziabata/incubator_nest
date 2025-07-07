import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { QuestionTypeOrmRepository } from "../infrastructure/question-typeorm.repository";
import { TogglePublishStatusInputDto } from "../api/input-dto/toggle-publish-status.input-dto";
import { BadRequestDomainException } from "../../../../core/exceptions/domain-exceptions";

export class ToggleQuestionPublishStatusUsecaseCommand {
    constructor(
        public id: string,
        public dto: TogglePublishStatusInputDto
    ) {}
}

@CommandHandler(ToggleQuestionPublishStatusUsecaseCommand)
export class ToggleQuestionPublishStatusUseCase implements ICommandHandler<ToggleQuestionPublishStatusUsecaseCommand> {
  constructor(
    private questionRepository: QuestionTypeOrmRepository,
  ) {}
  async execute(command: ToggleQuestionPublishStatusUsecaseCommand): Promise<void> {
    const question = await this.questionRepository.findOrNotFoundFail(command.id);
    const questionAnswers = JSON.parse(question.answers);
    if(!questionAnswers.length ) {
      throw BadRequestDomainException.create('Question must have at least one answer', 'question');
    }
    question.published = command.dto.published;
    await this.questionRepository.save(question);
  }
}