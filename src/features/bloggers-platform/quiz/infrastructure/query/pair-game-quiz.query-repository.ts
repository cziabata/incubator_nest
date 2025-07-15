import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameTypeOrmEntity } from '../../domain/game-typeorm.entity';
import { PlayerTypeOrmEntity } from '../../domain/player-typeorm.entity';
import { AnswerTypeOrmEntity } from '../../domain/answer-typeorm.entity';
import { GamePairViewDto } from '../../api/view-dto/game-pair.view-dto';
import { PlayerProgressViewDto } from '../../api/view-dto/player-progress.view-dto';
import { PlayerViewDto } from '../../api/view-dto/player.view-dto';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';
import { GameStatus } from '../../domain/types/game-status.enum';

@Injectable()
export class PairGameQuizQueryRepository {
  constructor(
    @InjectRepository(GameTypeOrmEntity)
    private readonly gameRepo: Repository<GameTypeOrmEntity>,
    @InjectRepository(PlayerTypeOrmEntity)
    private readonly playerRepo: Repository<PlayerTypeOrmEntity>,
    @InjectRepository(AnswerTypeOrmEntity)
    private readonly answerRepo: Repository<AnswerTypeOrmEntity>,
  ) {}

  async getCurrentGameByUserId(userId: string): Promise<GamePairViewDto> {
    const game = await this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player_1', 'player1')
      .leftJoinAndSelect('player1.user', 'user1')
      .leftJoinAndSelect('game.player_2', 'player2')
      .leftJoinAndSelect('player2.user', 'user2')
      .leftJoinAndSelect('game.questions', 'gameQuestions')
      .leftJoinAndSelect('gameQuestions.question', 'question')
      .where('(user1.id = :userId OR user2.id = :userId)', { userId })
      .andWhere('game.status IN (:...statuses)', { statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active] })
      .getOne();

    if (!game) {
      throw new NotFoundException('No active pair for current user');
    }

    return await this.mapGameToViewDto(game, userId);
  }

  async getGameById(gameId: number, userId: string): Promise<GamePairViewDto> {
    const game = await this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player_1', 'player1')
      .leftJoinAndSelect('player1.user', 'user1')
      .leftJoinAndSelect('game.player_2', 'player2')
      .leftJoinAndSelect('player2.user', 'user2')
      .leftJoinAndSelect('game.questions', 'gameQuestions')
      .leftJoinAndSelect('gameQuestions.question', 'question')
      .where('game.id = :gameId', { gameId })
      .getOne();

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Check if user is participant
    const isParticipant = 
      (game.player_1?.user?.id === userId) || 
      (game.player_2?.user?.id === userId);

    if (!isParticipant) {
      throw new ForbiddenException('Current user tries to get pair in which user is not participant');
    }

    return await this.mapGameToViewDto(game, userId);
  }

  private async mapGameToViewDto(game: GameTypeOrmEntity, currentUserId: string): Promise<GamePairViewDto> {
    // Check if required data is present
    if (!game.player_1) {
      throw new NotFoundException('Game data is incomplete - player_1 missing');
    }

    // Get player answers
    const firstPlayerAnswers = await this.getPlayerAnswers(game.player_1.id);
    const secondPlayerAnswers = game.player_2 ? await this.getPlayerAnswers(game.player_2.id) : [];

    // Map first player
    const firstPlayerProgress: PlayerProgressViewDto = {
      answers: firstPlayerAnswers.map(this.mapAnswerToViewDto),
      player: this.mapPlayerToViewDto(game.player_1),
      score: game.player_1.score
    };

    // Map second player
    const secondPlayerProgress: PlayerProgressViewDto | null = game.player_2 ? {
      answers: secondPlayerAnswers.map(this.mapAnswerToViewDto),
      player: this.mapPlayerToViewDto(game.player_2),
      score: game.player_2.score
    } : null;

    // Map questions (only if game is active)
    const questions: QuestionViewDto[] | null = 
      game.status === GameStatus.PendingSecondPlayer 
        ? null 
        : game.questions
            ?.sort((a, b) => a.indexPosition - b.indexPosition)
            .map(gq => ({
              id: gq.question.id.toString(),
              body: gq.question.body
            })) || null;

    return {
      id: game.id.toString(),
      firstPlayerProgress,
      secondPlayerProgress,
      questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate.toISOString(),
      startGameDate: game.startGameDate?.toISOString() || null,
      finishGameDate: game.finishGameDate?.toISOString() || null
    };
  }

  private async getPlayerAnswers(playerId: number): Promise<AnswerTypeOrmEntity[]> {
    return await this.answerRepo
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.question', 'question')
      .where('answer.player_id = :playerId', { playerId })
      .orderBy('answer.addedAt', 'ASC')
      .getMany();
  }

  private mapPlayerToViewDto(player: PlayerTypeOrmEntity): PlayerViewDto {
    if (!player.user) {
      throw new NotFoundException('Player data is incomplete - user missing');
    }

    return {
      id: player.user.id,
      login: player.user.login
    };
  }

  private mapAnswerToViewDto(answer: AnswerTypeOrmEntity): AnswerViewDto {
    if (!answer.question) {
      throw new NotFoundException('Answer data is incomplete - question missing');
    }

    return {
      questionId: answer.question.id.toString(),
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString()
    };
  }
} 