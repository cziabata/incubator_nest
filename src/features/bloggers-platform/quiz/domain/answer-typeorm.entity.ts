import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { PlayerTypeOrmEntity } from "./player-typeorm.entity";
import { QuestionTypeOrm } from "./question-typeorm.entity";
import { AnswerStatus } from "./types/answer-status.enum";

@Entity('answers')
export class AnswerTypeOrmEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'player_id', type: 'int'})
    player_id: number

    @ManyToOne(() => PlayerTypeOrmEntity, (player) => player.answers)
    @JoinColumn({name: 'player_id'})
    player: PlayerTypeOrmEntity

    @Column({name: 'question_id', type: 'int'})
    question_id: number

    @ManyToOne(() => QuestionTypeOrm, (question) => question.answerEntities)
    @JoinColumn({name: 'question_id'})
    question: QuestionTypeOrm

    @CreateDateColumn({name: 'added_at', type: 'timestamp with time zone'})
    addedAt: Date

    @Column({name: 'answer_status', type: 'enum', enum: AnswerStatus})
    answerStatus: AnswerStatus

}