import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserTypeOrmEntity } from "../../../user-accounts/domain/user-typeorm.entity";
import { AnswerTypeOrmEntity } from "./answer-typeorm.entity";
import { GameTypeOrmEntity } from "./game-typeorm.entity";

@Entity('players')
export class PlayerTypeOrmEntity {
    @PrimaryGeneratedColumn()   
    id: number;

    @Column({name: 'user_id', type: 'uuid'})
    userId: string

    @ManyToOne(() => UserTypeOrmEntity, (user) => user.player)
    user: UserTypeOrmEntity

    @OneToMany(() => AnswerTypeOrmEntity, (answer) => answer.player)
    answers: AnswerTypeOrmEntity[]

    @Column({name: 'score', type: 'int', default: 0})
    score: number

    @ManyToOne(() => GameTypeOrmEntity, (game) => game.players)
    game: GameTypeOrmEntity

}