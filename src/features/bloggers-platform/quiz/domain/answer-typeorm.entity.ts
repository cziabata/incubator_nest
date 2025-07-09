import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { PlayerTypeOrmEntity } from "./player-typeorm.entity";

@Entity('answers')
export class AnswerTypeOrmEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'player_id', type: 'int'})
    player_id: number

    @ManyToOne(() => PlayerTypeOrmEntity, (player) => player.answers)
    player: PlayerTypeOrmEntity

    @Column({name: 'question_id', type: 'int'})
    question_id: number

    @Column({name: 'date_created', type: 'timestamp with time zone'})
    date_created: Date

    @Column({name: 'status', type: 'varchar'})
    status: string

}