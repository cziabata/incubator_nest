import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { GameTypeOrmEntity } from "./game-typeorm.entity";
import { QuestionTypeOrm } from "./question-typeorm.entity";

@Entity('game_questions')
export class GameQuestionTypeOrmEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'game_id', type: 'int'})
    gameId: number

    @ManyToOne(() => GameTypeOrmEntity, (game) => game.questions)
    @JoinColumn({name: 'game_id'})
    game: GameTypeOrmEntity

    @Column({name: 'question_id', type: 'int'})
    questionId: number

    @ManyToOne(() => QuestionTypeOrm, (question) => question.gameQuestions)
    @JoinColumn({name: 'question_id'})
    question: QuestionTypeOrm

    @Column({name: 'index_position', type: 'int'})
    indexPosition: number
} 