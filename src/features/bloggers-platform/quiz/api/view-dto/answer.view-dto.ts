import { AnswerStatus } from "../../domain/types/answer-status.enum";

export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
} 