export class QuestionViewDto {
    id: string;
    body: string;
    answers: string[];
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  
    static mapToView(question: any): QuestionViewDto {
      const dto = new QuestionViewDto();
      dto.id = question.id?.toString();
      dto.body = question.body;
      dto.answers = JSON.parse(question.answers);
      dto.published = question.published;
      dto.createdAt = question.created_at;
      dto.updatedAt = question.updated_at;
      return dto;
    }
  }