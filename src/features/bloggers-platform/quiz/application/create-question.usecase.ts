import { ICommandHandler, CommandHandler } from "@nestjs/cqrs";
import { CreateQuestionInputDto } from "../api/input-dto/create-question.input-dto";
import { QuestionTypeOrmRepository } from "../infrastructure/question-typeorm.repository";

export class CreateQuestionUsecaseCommand {
    constructor(
        public dto: CreateQuestionInputDto
    ) {}
}

@CommandHandler(CreateQuestionUsecaseCommand)
export class CreateQuestionUseCase implements ICommandHandler<CreateQuestionUsecaseCommand, number> {
  constructor(
    private questionRepository: QuestionTypeOrmRepository,
  ) {}
  async execute(command: CreateQuestionUsecaseCommand): Promise<number> {
    const dto = command.dto;
    const question = await this.questionRepository.create(dto);
    const questionId = question.id;
    return questionId;
  }
}