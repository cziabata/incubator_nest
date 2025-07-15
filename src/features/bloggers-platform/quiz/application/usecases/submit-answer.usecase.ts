import { Injectable, ForbiddenException } from '@nestjs/common';
import { AnswerTypeOrmEntity } from '../../domain/answer-typeorm.entity';
import { AnswerStatus } from '../../domain/types/answer-status.enum';
import { PairGameQuizRepository } from '../../infrastructure/pair-game-quiz.repository';

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    private readonly pairGameQuizRepository: PairGameQuizRepository,
  ) {}

  async execute(userId: string, answer: string): Promise<AnswerTypeOrmEntity> {
    // Find active game for user
    const activeGame = await this.pairGameQuizRepository.findActiveGameByUserId(userId);
    if (!activeGame) {
      throw new ForbiddenException('Current user is not inside active pair');
    }

    // Find current player
    const player = await this.pairGameQuizRepository.findPlayerByUserIdAndGameId(userId, activeGame.id);
    if (!player) {
      throw new ForbiddenException('Player not found in game');
    }

    // Get next question to answer
    const nextQuestion = await this.pairGameQuizRepository.getNextQuestionForPlayer(activeGame.id, player.id);
    if (!nextQuestion) {
      throw new ForbiddenException('User has already answered to all questions');
    }

    // Check if answer is correct
    const isCorrect = await this.pairGameQuizRepository.checkAnswer(nextQuestion.id, answer);
    const answerStatus = isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect;

    // Save answer
    const savedAnswer = await this.pairGameQuizRepository.saveAnswer(player.id, nextQuestion.id, answerStatus);

    // Update player score if correct
    if (isCorrect) {
      await this.pairGameQuizRepository.incrementPlayerScore(player.id);
    }

    // Check if game should be finished and calculate bonus
    await this.checkAndFinishGameIfNeeded(activeGame.id);

    return savedAnswer;
  }

  private async checkAndFinishGameIfNeeded(gameId: number): Promise<void> {
    // Get both players with their answers
    const players = await this.pairGameQuizRepository.getGamePlayersWithAnswers(gameId);
    
    // Get the total number of questions in this game
    const totalQuestions = await this.pairGameQuizRepository.getGameQuestionsCount(gameId);
    
    // Check if both players have answered all questions
    const bothFinished = players.every(player => player.answers.length >= totalQuestions);
    
    if (bothFinished) {
      // Calculate who finished first and award bonus point
      await this.calculateAndAwardBonusPoint(players);
      
      // Finish the game
      await this.pairGameQuizRepository.finishGame(gameId);
    }
  }

  private async calculateAndAwardBonusPoint(players: any[]): Promise<void> {
    if (players.length !== 2) return;

    const [player1, player2] = players;
    
    // Get last answer time for each player
    const player1LastAnswer = player1.answers[player1.answers.length - 1]?.addedAt;
    const player2LastAnswer = player2.answers[player2.answers.length - 1]?.addedAt;
    
    if (!player1LastAnswer || !player2LastAnswer) return;

    // Determine who finished first
    const player1FinishedFirst = new Date(player1LastAnswer) < new Date(player2LastAnswer);
    const fasterPlayer = player1FinishedFirst ? player1 : player2;
    
    // Check if faster player has at least one correct answer
    const hasCorrectAnswer = fasterPlayer.answers.some((answer: any) => 
      answer.answerStatus === AnswerStatus.Correct
    );
    
    if (hasCorrectAnswer) {
      await this.pairGameQuizRepository.addBonusPoint(fasterPlayer.id);
    }
  }
} 