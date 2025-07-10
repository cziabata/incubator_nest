import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsTypeOrmModule } from '../../user-accounts/user-accounts-typeorm.module';
import { QuestionTypeOrm } from './domain/question-typeorm.entity';
import { GameTypeOrmEntity } from './domain/game-typeorm.entity';
import { PlayerTypeOrmEntity } from './domain/player-typeorm.entity';
import { AnswerTypeOrmEntity } from './domain/answer-typeorm.entity';
import { GameQuestionTypeOrmEntity } from './domain/game-question-typeorm.entity';
import { QuizSaTypeOrmController } from './api/quiz.sa.controller';
import { PairGameQuizController } from './api/pair-game-quiz.controller';
import { QuestionTypeOrmQueryRepository } from './infrastructure/query/question-typeorm.query-repository';
import { PairGameQuizQueryRepository } from './infrastructure/query/pair-game-quiz.query-repository';
import { QuestionTypeOrmRepository } from './infrastructure/question-typeorm.repository';
import { PairGameQuizRepository } from './infrastructure/pair-game-quiz.repository';
import { CreateQuestionUseCase } from './application/create-question.usecase';
import { DeleteQuestionUseCase } from './application/delete-question.usecase';
import { ToggleQuestionPublishStatusUseCase } from './application/toggle-question-publish-status.usecase';
import { UpdateQuestionUseCase } from './application/update-question.usecase';
import { ConnectToGameUseCase } from './application/usecases/connect-to-game.usecase';
import { SubmitAnswerUseCase } from './application/usecases/submit-answer.usecase';
import { PairGameQuizService } from './application/pair-game-quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionTypeOrm,
      GameTypeOrmEntity,
      PlayerTypeOrmEntity,
      AnswerTypeOrmEntity,
      GameQuestionTypeOrmEntity,
    ]),
    UserAccountsTypeOrmModule,
  ],
  controllers: [
    QuizSaTypeOrmController,
    PairGameQuizController,
  ],
  providers: [
    // Query repositories
    QuestionTypeOrmQueryRepository,
    PairGameQuizQueryRepository,
    
    // Write repositories
    QuestionTypeOrmRepository,
    PairGameQuizRepository,
    
    // Question use cases
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    ToggleQuestionPublishStatusUseCase,
    
    // Game use cases
    ConnectToGameUseCase,
    SubmitAnswerUseCase,
    
    // Services
    PairGameQuizService,
  ],
  exports: [
    QuestionTypeOrmQueryRepository,
    QuestionTypeOrmRepository,
    PairGameQuizQueryRepository,
    PairGameQuizRepository,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    ToggleQuestionPublishStatusUseCase,
    ConnectToGameUseCase,
    SubmitAnswerUseCase,
    PairGameQuizService,
    TypeOrmModule
  ]
})
export class QuizTypeOrmModule {} 