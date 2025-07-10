import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContext } from '../../user-accounts/guards/dto/user-context.dto';
import { GamePairViewDto } from './view-dto/game-pair.view-dto';
import { AnswerViewDto } from './view-dto/answer.view-dto';
import { SubmitAnswerInputDto } from './input-dto/submit-answer.input-dto';
import { PairGameQuizService } from '../application/pair-game-quiz.service';
import { PairGameQuizQueryRepository } from '../infrastructure/query/pair-game-quiz.query-repository';

@Controller('pair-game-quiz/pairs')
@UseGuards(JwtAuthGuard)
export class PairGameQuizController {
  constructor(
    private readonly pairGameQuizService: PairGameQuizService,
    private readonly pairGameQuizQueryRepository: PairGameQuizQueryRepository,
  ) {}
  
  @Get('my-current')
  async getCurrentGame(
    @ExtractUserFromRequest() user: UserContext
  ): Promise<GamePairViewDto> {
    return await this.pairGameQuizQueryRepository.getCurrentGameByUserId(user.userId);
  }

  @Get(':id')
  async getGameById(
    @Param('id') gameId: string,
    @ExtractUserFromRequest() user: UserContext
  ): Promise<GamePairViewDto> {
    return await this.pairGameQuizQueryRepository.getGameById(gameId, user.userId);
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectToGame(
    @ExtractUserFromRequest() user: UserContext
  ): Promise<GamePairViewDto> {
    const game = await this.pairGameQuizService.connectToGame(user.userId);
    return await this.pairGameQuizQueryRepository.getGameById(game.id.toString(), user.userId);
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Body() submitAnswerDto: SubmitAnswerInputDto,
    @ExtractUserFromRequest() user: UserContext
  ): Promise<AnswerViewDto> {
    const answer = await this.pairGameQuizService.submitAnswer(user.userId, submitAnswerDto.answer);
    
    return {
      questionId: answer.question_id.toString(),
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt.toISOString()
    };
  }
} 