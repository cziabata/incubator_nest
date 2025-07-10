import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GameQuestionTypeOrmEntity } from './game-question-typeorm.entity';
import { AnswerTypeOrmEntity } from './answer-typeorm.entity';

@Entity('quiz_questions')
export class QuestionTypeOrm {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: false })
  body: string;

  @Column({ type: 'varchar', nullable: false })
  answers: string;

  @Column({ name: 'published', type: 'boolean', default: false, nullable: false })
  published: boolean;

  @OneToMany(() => GameQuestionTypeOrmEntity, (gameQuestion) => gameQuestion.question)
  gameQuestions: GameQuestionTypeOrmEntity[]

  @OneToMany(() => AnswerTypeOrmEntity, (answer) => answer.question)
  answerEntities: AnswerTypeOrmEntity[]

} 