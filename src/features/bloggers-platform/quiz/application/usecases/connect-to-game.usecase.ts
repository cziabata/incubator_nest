import { Injectable, ForbiddenException } from '@nestjs/common';
import { GameTypeOrmEntity } from '../../domain/game-typeorm.entity';
import { GameStatus } from '../../domain/types/game-status.enum';
import { PairGameQuizRepository } from '../../infrastructure/pair-game-quiz.repository';

@Injectable()
export class ConnectToGameUseCase {
  constructor(
    private readonly pairGameQuizRepository: PairGameQuizRepository,
  ) {}

  async execute(userId: string): Promise<GameTypeOrmEntity> {
    // Check if user already has active game
    const existingGame = await this.pairGameQuizRepository.findActiveGameByUserId(userId);
    if (existingGame) {
      throw new ForbiddenException('User is already participating in active pair');
    }

    // Try to find pending game to join
    const pendingGame = await this.pairGameQuizRepository.findPendingGame();
    
    if (pendingGame) {
      // Join existing pending game
      return await this.joinPendingGame(pendingGame, userId);
    } else {
      // Create new pending game
      return await this.createNewPendingGame(userId);
    }
  }

  private async joinPendingGame(game: GameTypeOrmEntity, userId: string): Promise<GameTypeOrmEntity> {
    // Create second player
    const player2 = await this.pairGameQuizRepository.createPlayer(userId, game.id);
    
    // Update game with second player and set status to Active
    await this.pairGameQuizRepository.updateGameWithSecondPlayer(game.id, player2.id);
    
    // Select random 6 questions for the game
    const questions = await this.pairGameQuizRepository.getRandomPublishedQuestions(6);
    const questionIds = questions.map(q => q.id);
    await this.pairGameQuizRepository.assignQuestionsToGame(game.id, questionIds);
    
    // Return updated game
    return await this.pairGameQuizRepository.findActiveGameByUserId(userId) as GameTypeOrmEntity;
  }

  private async createNewPendingGame(userId: string): Promise<GameTypeOrmEntity> {
    // Create first player without game reference first
    const player1 = await this.pairGameQuizRepository.createPlayer(userId);
    
    // Create game with correct player1Id
    const game = await this.pairGameQuizRepository.createGame(player1.id);
    
    // Link player with the created game
    await this.pairGameQuizRepository.updatePlayerGame(player1.id, game.id);
    
    // Return created game
    return await this.pairGameQuizRepository.findActiveGameByUserId(userId) as GameTypeOrmEntity;
  }
} 