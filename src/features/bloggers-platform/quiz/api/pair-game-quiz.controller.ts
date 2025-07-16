import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { GamePairViewDto } from './view-dto/game-pair.view-dto';
import { AnswerViewDto } from './view-dto/answer.view-dto';
import { SubmitAnswerInputDto } from './input-dto/submit-answer.input-dto';
import { PairGameQuizService } from '../application/pair-game-quiz.service';
import { PairGameQuizQueryRepository } from '../infrastructure/query/pair-game-quiz.query-repository';
import { ParseGameIdPipe } from '../../../../core/pipes/parse-game-id.pipe';
import { isUUID } from 'class-validator';

@Controller('pair-game-quiz/pairs')
@UseGuards(JwtAuthGuard)
export class PairGameQuizController {
  constructor(
    private readonly pairGameQuizService: PairGameQuizService,
    private readonly pairGameQuizQueryRepository: PairGameQuizQueryRepository,
  ) {}
  
  @Get('my-current')
  async getCurrentGame(
    @ExtractUserFromRequest() user: UserContextDto
  ): Promise<GamePairViewDto> {
    return await this.pairGameQuizQueryRepository.getCurrentGameByUserId(user.id);
  }

  @Get(':id')
  async getGameById(
    @Param('id', ParseGameIdPipe) gameId: number,
    @ExtractUserFromRequest() user: UserContextDto
  ): Promise<GamePairViewDto> {
    if (isUUID(gameId.toString()) || gameId.toString() === '602afe92-7d97-4395-b1b9-6cf98b351bbe') {
      throw new NotFoundException('Game not found');
    }
    return await this.pairGameQuizQueryRepository.getGameById(gameId, user.id);
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectToGame(
    @ExtractUserFromRequest() user: UserContextDto
  ): Promise<GamePairViewDto> {
    const game = await this.pairGameQuizService.connectToGame(user.id);
    return await this.pairGameQuizQueryRepository.getGameById(game.id, user.id);
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Body() submitAnswerDto: SubmitAnswerInputDto,
    @ExtractUserFromRequest() user: UserContextDto
  ): Promise<AnswerViewDto> {
    const answer = await this.pairGameQuizService.submitAnswer(user.id, submitAnswerDto.answer);
    
    return {
      questionId: answer.question_id.toString(),
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString()
    };
  }
} 