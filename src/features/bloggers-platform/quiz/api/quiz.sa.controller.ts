import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { QuestionTypeOrmQueryRepository } from '../infrastructure/query/question-typeorm.query-repository';
import { GetQuestionsQueryParams } from './input-dto/get-questions-query-params.input-dto';
import { QuestionViewDto } from './view-dto/questions.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreateQuestionInputDto } from './input-dto/create-question.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionUsecaseCommand } from '../application/create-question.usecase';
import { UpdateQuestionInputDto } from './input-dto/update-question.input-dto';
import { UpdateQuestionUsecaseCommand } from '../application/update-question.usecase';
import { DeleteQuestionUsecaseCommand } from '../application/delete-question.usecase';
import { TogglePublishStatusInputDto } from './input-dto/toggle-publish-status.input-dto';
import { ToggleQuestionPublishStatusUsecaseCommand } from '../application/toggle-question-publish-status.usecase';

@Controller('sa/quiz/questions')
export class QuizSaTypeOrmController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly questionQueryRepository: QuestionTypeOrmQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllQuestions(@Query() query: GetQuestionsQueryParams): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.questionQueryRepository.getAll(query);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createQuestion(@Body() dto: CreateQuestionInputDto): Promise<QuestionViewDto> {
    const questionId = await this.commandBus.execute(new CreateQuestionUsecaseCommand(dto));
    return this.questionQueryRepository.getById(questionId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionInputDto): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionUsecaseCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionUsecaseCommand(id));
  }

  @Put(':id/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async toggleQuestionPublishStatus(@Param('id') id: string, @Body() dto: TogglePublishStatusInputDto): Promise<void> {
    await this.commandBus.execute(new ToggleQuestionPublishStatusUsecaseCommand(id, dto));
  }
} 