export class QuestionViewDto {
    id: string;
    body: string;
    correctAnswers: string[];
    published: boolean;
    createdAt: Date;
    updatedAt: Date | null;
  
    static mapToView(question: any): QuestionViewDto {
      const dto = new QuestionViewDto();
      dto.id = question.id?.toString();
      dto.body = question.body;
      dto.correctAnswers = JSON.parse(question.answers);
      dto.published = question.published;
      dto.createdAt = question.created_at;
      // If createdAt and updatedAt are equal, it means the record was just created and not updated
      dto.updatedAt = question.created_at?.getTime() === question.updated_at?.getTime() ? null : question.updated_at;
      return dto;
    }
  }