import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user-typeorm.entity';

@Entity('sessions')
export class SessionTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ name: 'device_id', type: 'varchar' })
  deviceId: string;

  @Column({ name: 'iat', type: 'timestamp with time zone' })
  iat: Date;

  @Column({ name: 'device_name', type: 'varchar' })
  deviceName: string;

  @Column({ name: 'ip', type: 'varchar' })
  ip: string;

  @Column({ name: 'exp', type: 'timestamp with time zone' })
  exp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relation to User entity
  @ManyToOne(() => UserTypeOrmEntity, (user) => user.sessions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserTypeOrmEntity | null;

  // Domain methods
  isExpired(): boolean {
    return new Date() > this.exp;
  }

  isActive(): boolean {
    return !this.isExpired();
  }

  updateExpiration(newExpDate: Date): void {
    this.exp = newExpDate;
  }

  updateIat(newIat: Date): void {
    this.iat = newIat;
  }

  // Factory method
  static create(
    userId: string | null,
    deviceId: string,
    deviceName: string,
    ip: string,
    iat: Date,
    exp: Date,
  ): SessionTypeOrmEntity {
    const session = new SessionTypeOrmEntity();
    session.userId = userId;
    session.deviceId = deviceId;
    session.deviceName = deviceName;
    session.ip = ip;
    session.iat = iat;
    session.exp = exp;
    return session;
  }
} 