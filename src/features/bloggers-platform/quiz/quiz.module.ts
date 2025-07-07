import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionTypeOrm } from './domain/question-typeorm.entity';
import { QuizSaTypeOrmController } from './api/quiz.sa.controller';
import { QuestionTypeOrmQueryRepository } from './infrastructure/query/question-typeorm.query-repository';
import { QuestionTypeOrmRepository } from './infrastructure/question-typeorm.repository';
import { CreateQuestionUseCase } from './application/create-question.usecase';
import { DeleteQuestionUseCase } from './application/delete-question.usecase';
import { ToggleQuestionPublishStatusUseCase } from './application/toggle-question-publish-status.usecase';
import { UpdateQuestionUseCase } from './application/update-question.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionTypeOrm]),
  ],
  controllers: [
    QuizSaTypeOrmController
  ],
  providers: [
    QuestionTypeOrmQueryRepository,
    QuestionTypeOrmRepository,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    ToggleQuestionPublishStatusUseCase,
  ],
  exports: [
    QuestionTypeOrmQueryRepository,
    QuestionTypeOrmRepository,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    ToggleQuestionPublishStatusUseCase,
    TypeOrmModule
  ]
})
export class QuizTypeOrmModule {} 