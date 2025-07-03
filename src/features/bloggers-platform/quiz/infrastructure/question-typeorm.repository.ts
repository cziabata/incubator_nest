import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionTypeOrm } from '../domain/question-typeorm.entity';
import { QuestionTypeOrmFactory } from '../domain/question-typeorm.factory';
import { CreateQuestionInputDto } from '../api/input-dto/create-question.input-dto';
import { UpdateQuestionInputDto } from '../api/input-dto/update-question.input-dto';

@Injectable()
export class QuestionTypeOrmRepository {
  constructor(
    @InjectRepository(QuestionTypeOrm)
    private questionRepository: Repository<QuestionTypeOrm>
  ) {}

  async findById(id: string): Promise<QuestionTypeOrm | null> {
    return await this.questionRepository.findOne({ where: { id: Number(id) } });
  }

  async findOrNotFoundFail(id: string): Promise<QuestionTypeOrm> {
    const question = await this.findById(id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async create(dto: CreateQuestionInputDto): Promise<QuestionTypeOrm> {
    const question = QuestionTypeOrmFactory.createQuestion(dto);
    return await this.questionRepository.save(question);
  }

  async update(id: string, dto: UpdateQuestionInputDto): Promise<void> {
    const question = await this.findOrNotFoundFail(id);
    const updatedQuestion = QuestionTypeOrmFactory.updateQuestion(question, dto);
    await this.questionRepository.save(updatedQuestion);
  }

  async deleteById(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
    await this.questionRepository.delete({ id: Number(id) });
  }

  async save(question: QuestionTypeOrm): Promise<QuestionTypeOrm> {
    return await this.questionRepository.save(question);
  }
} 