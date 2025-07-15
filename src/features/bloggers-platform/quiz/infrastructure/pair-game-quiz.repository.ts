import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameTypeOrmEntity } from '../domain/game-typeorm.entity';
import { PlayerTypeOrmEntity } from '../domain/player-typeorm.entity';
import { AnswerTypeOrmEntity } from '../domain/answer-typeorm.entity';
import { GameQuestionTypeOrmEntity } from '../domain/game-question-typeorm.entity';
import { QuestionTypeOrm } from '../domain/question-typeorm.entity';
import { GameStatus } from '../domain/types/game-status.enum';
import { AnswerStatus } from '../domain/types/answer-status.enum';

@Injectable()
export class PairGameQuizRepository {
  constructor(
    @InjectRepository(GameTypeOrmEntity)
    private readonly gameRepo: Repository<GameTypeOrmEntity>,
    @InjectRepository(PlayerTypeOrmEntity)
    private readonly playerRepo: Repository<PlayerTypeOrmEntity>,
    @InjectRepository(AnswerTypeOrmEntity)
    private readonly answerRepo: Repository<AnswerTypeOrmEntity>,
    @InjectRepository(GameQuestionTypeOrmEntity)
    private readonly gameQuestionRepo: Repository<GameQuestionTypeOrmEntity>,
    @InjectRepository(QuestionTypeOrm)
    private readonly questionRepo: Repository<QuestionTypeOrm>,
  ) {}

  async findActiveGameByUserId(userId: string): Promise<GameTypeOrmEntity | null> {
    return await this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player_1', 'player1')
      .leftJoinAndSelect('player1.user', 'user1')
      .leftJoinAndSelect('game.player_2', 'player2')
      .leftJoinAndSelect('player2.user', 'user2')
      .where('(user1.id = :userId OR user2.id = :userId)', { userId })
      .andWhere('game.status IN (:...statuses)', { 
        statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active] 
      })
      .getOne();
  }

  async findPendingGame(): Promise<GameTypeOrmEntity | null> {
    return await this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player_1', 'player1')
      .leftJoinAndSelect('player1.user', 'user1')
      .where('game.status = :status', { status: GameStatus.PendingSecondPlayer })
      .getOne();
  }

  async createGame(player1Id: number): Promise<GameTypeOrmEntity> {
    const game = this.gameRepo.create({
      player1Id,
      status: GameStatus.PendingSecondPlayer
    });

    return await this.gameRepo.save(game);
  }

  async createPlayer(userId: string, gameId?: number): Promise<PlayerTypeOrmEntity> {
    const player = this.playerRepo.create({
      userId,
      score: 0,
      gameId: gameId || null
    });

    return await this.playerRepo.save(player);
  }

  async updatePlayerGame(playerId: number, gameId: number): Promise<void> {
    await this.playerRepo.update(playerId, {
      gameId
    });
  }

  async updateGameWithSecondPlayer(gameId: number, player2Id: number): Promise<void> {
    await this.gameRepo.update(gameId, {
      player2Id,
      status: GameStatus.Active,
      startGameDate: new Date()
    });
  }

  async assignQuestionsToGame(gameId: number, questionIds: number[]): Promise<void> {
    const gameQuestions = questionIds.map((questionId, index) => 
      this.gameQuestionRepo.create({
        gameId,
        questionId,
        indexPosition: index + 1
      })
    );

    await this.gameQuestionRepo.save(gameQuestions);
  }

  async getRandomPublishedQuestions(count: number): Promise<QuestionTypeOrm[]> {
    return await this.questionRepo
      .createQueryBuilder('question')
      .where('question.published = :published', { published: true })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async findPlayerByUserIdAndGameId(userId: string, gameId: number): Promise<PlayerTypeOrmEntity | null> {
    return await this.playerRepo
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.user', 'user')
      .leftJoinAndSelect('player.game', 'game')
      .where('user.id = :userId', { userId })
      .andWhere('game.id = :gameId', { gameId })
      .getOne();
  }

  async getAnsweredQuestionsCount(playerId: number): Promise<number> {
    return await this.answerRepo
      .createQueryBuilder('answer')
      .where('answer.player_id = :playerId', { playerId })
      .getCount();
  }

  async getNextQuestionForPlayer(gameId: number, playerId: number): Promise<QuestionTypeOrm | null> {
    // Get answered question IDs
    const answeredQuestionIds = await this.answerRepo
      .createQueryBuilder('answer')
      .select('answer.question_id')
      .where('answer.player_id = :playerId', { playerId })
      .getRawMany();

    const answeredIds = answeredQuestionIds.map(a => a.question_id);

    // Get next unanswered question
    const gameQuestion = await this.gameQuestionRepo
      .createQueryBuilder('gq')
      .leftJoinAndSelect('gq.question', 'question')
      .where('gq.gameId = :gameId', { gameId })
      .andWhere(answeredIds.length > 0 ? 'gq.questionId NOT IN (:...answeredIds)' : '1=1', 
        { answeredIds })
      .orderBy('gq.indexPosition', 'ASC')
      .getOne();

    return gameQuestion?.question || null;
  }

  async saveAnswer(playerId: number, questionId: number, answerStatus: AnswerStatus): Promise<AnswerTypeOrmEntity> {
    const answer = this.answerRepo.create({
      player_id: playerId,
      question_id: questionId,
      answerStatus
    });

    return await this.answerRepo.save(answer);
  }

  async incrementPlayerScore(playerId: number): Promise<void> {
    await this.playerRepo
      .createQueryBuilder()
      .update(PlayerTypeOrmEntity)
      .set({ score: () => 'score + 1' })
      .where('id = :playerId', { playerId })
      .execute();
  }

  async checkAnswer(questionId: number, answer: string): Promise<boolean> {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) return false;

    // Parse correct answers (assuming they're stored as JSON array)
    try {
      const correctAnswers: string[] = JSON.parse(question.answers);
      return correctAnswers.some(correctAnswer => 
        correctAnswer.toLowerCase() === answer.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  async finishGame(gameId: number): Promise<void> {
    await this.gameRepo.update(gameId, {
      status: GameStatus.Finished,
      finishGameDate: new Date()
    });
  }

  async getGamePlayersWithAnswers(gameId: number): Promise<PlayerTypeOrmEntity[]> {
    return await this.playerRepo
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.answers', 'answers')
      .leftJoinAndSelect('player.game', 'game')
      .where('game.id = :gameId', { gameId })
      .getMany();
  }

  async getGameQuestionsCount(gameId: number): Promise<number> {
    return await this.gameQuestionRepo
      .createQueryBuilder('gq')
      .where('gq.gameId = :gameId', { gameId })
      .getCount();
  }

  async addBonusPoint(playerId: number): Promise<void> {
    await this.incrementPlayerScore(playerId);
  }
} 