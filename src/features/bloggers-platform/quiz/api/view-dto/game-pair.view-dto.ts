import { GameStatus } from "../../domain/types/game-status.enum";
import { PlayerProgressViewDto } from "./player-progress.view-dto";
import { QuestionViewDto } from "./question.view-dto";

export class GamePairViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressViewDto;
  secondPlayerProgress: PlayerProgressViewDto | null;
  questions: QuestionViewDto[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
} 