import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserTypeOrmEntity } from "../../../user-accounts/domain/user-typeorm.entity";
import { AnswerTypeOrmEntity } from "./answer-typeorm.entity";

@Entity('games')
export class PlayerTypeOrmEntity {
    @PrimaryGeneratedColumn()   
    id: number;

    @ManyToOne(() => UserTypeOrmEntity, (user) => user.player)
    user: UserTypeOrmEntity

    @OneToMany(() => AnswerTypeOrmEntity, (answer) => answer.player)
    answers: AnswerTypeOrmEntity[]

    @Column({name: 'score', type: 'int', default: 0})
    score: number

}