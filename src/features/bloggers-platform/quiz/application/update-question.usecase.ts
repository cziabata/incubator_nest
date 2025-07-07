import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { QuestionTypeOrmRepository } from "../infrastructure/question-typeorm.repository";
import { UpdateQuestionInputDto } from "../api/input-dto/update-question.input-dto";
import { BadRequestDomainException } from "../../../../core/exceptions/domain-exceptions";

export class UpdateQuestionUsecaseCommand {
    constructor(
        public id: string,
        public dto: UpdateQuestionInputDto
    ) {}
}

@CommandHandler(UpdateQuestionUsecaseCommand)
export class UpdateQuestionUseCase implements ICommandHandler<UpdateQuestionUsecaseCommand> {
  constructor(
    private questionRepository: QuestionTypeOrmRepository,
  ) {}
  async execute(command: UpdateQuestionUsecaseCommand): Promise<void> {
    const question = await this.questionRepository.findOrNotFoundFail(command.id);
    if(question.published && !command.dto.correctAnswers.length ) {
      throw BadRequestDomainException.create('Question must have at least one correct answer', 'question');
    }
    question.body = command.dto.body;
    question.answers = JSON.stringify(command.dto.correctAnswers);
    await this.questionRepository.save(question);
  }
}