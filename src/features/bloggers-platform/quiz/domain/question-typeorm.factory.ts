import { CreateQuestionDomainDto } from './dto/create-question.domain.dto';
import { UpdateQuestionDomainDto } from './dto/update-question.domain.dto';
import { QuestionTypeOrm } from './question-typeorm.entity';

export class QuestionTypeOrmFactory {
  static createQuestion(dto: CreateQuestionDomainDto): QuestionTypeOrm {
    const question = new QuestionTypeOrm();
    question.body = dto.body;
    question.answers = JSON.stringify(dto.correctAnswers);
    question.published = false;
    
    return question;
  }

  static updateQuestion(question: QuestionTypeOrm, dto: UpdateQuestionDomainDto): QuestionTypeOrm {
    question.body = dto.body;
    question.answers = JSON.stringify(dto.correctAnswers);
    
    return question;
  }
} 