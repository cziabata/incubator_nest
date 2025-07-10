import { Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn } from "typeorm";
import { PlayerTypeOrmEntity } from "./player-typeorm.entity";
import { GameQuestionTypeOrmEntity } from "./game-question-typeorm.entity";
import { GameStatus } from "./types/game-status.enum";

@Entity('games')
export class GameTypeOrmEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'player_1_id', type: 'int'})
    player1Id: number

    @ManyToOne(() => PlayerTypeOrmEntity, (player) => player.game)
    @JoinColumn({name: 'player_1_id'})
    player_1: PlayerTypeOrmEntity

    @Column({name: 'player_2_id', type: 'int', nullable: true})
    player2Id: number | null

    @ManyToOne(() => PlayerTypeOrmEntity, (player) => player.game)
    @JoinColumn({name: 'player_2_id'})
    player_2: PlayerTypeOrmEntity | null

    @OneToMany(() => PlayerTypeOrmEntity, (player) => player.game)
    players: PlayerTypeOrmEntity[]

    @OneToMany(() => GameQuestionTypeOrmEntity, (gameQuestion) => gameQuestion.game)
    questions: GameQuestionTypeOrmEntity[]

    @Column({name: 'status', type: 'enum', enum: GameStatus, default: GameStatus.PendingSecondPlayer})
    status: GameStatus

    @CreateDateColumn({name: 'pair_created_date', type: 'timestamp with time zone'})
    pairCreatedDate: Date

    @Column({name: 'start_game_date', type: 'timestamp with time zone', nullable: true})
    startGameDate: Date | null

    @Column({name: 'finish_game_date', type: 'timestamp with time zone', nullable: true})
    finishGameDate: Date | null
}