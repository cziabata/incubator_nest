import { Injectable } from '@nestjs/common';
import { ConnectToGameUseCase } from './usecases/connect-to-game.usecase';
import { SubmitAnswerUseCase } from './usecases/submit-answer.usecase';
import { GameTypeOrmEntity } from '../domain/game-typeorm.entity';
import { AnswerTypeOrmEntity } from '../domain/answer-typeorm.entity';

@Injectable()
export class PairGameQuizService {
  constructor(
    private readonly connectToGameUseCase: ConnectToGameUseCase,
    private readonly submitAnswerUseCase: SubmitAnswerUseCase,
  ) {}

  async connectToGame(userId: string): Promise<GameTypeOrmEntity> {
    return await this.connectToGameUseCase.execute(userId);
  }

  async submitAnswer(userId: string, answer: string): Promise<AnswerTypeOrmEntity> {
    return await this.submitAnswerUseCase.execute(userId, answer);
  }
} 