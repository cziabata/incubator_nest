import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SessionTypeOrmEntity } from './session-typeorm.entity';

@Entity('users')
export class UserTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  login: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  // Note: keeping the typo 'emai' to match existing database schema
  @Column({ name: 'is_emai_confirmed', type: 'boolean', default: false })
  isEmailConfirmed: boolean;

  @Column({ name: 'confirmation_code', type: 'varchar', nullable: true })
  confirmationCode: string | null;

  @Column({ name: 'expiration_date', type: 'timestamp with time zone', nullable: true })
  expirationDate: Date | null;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relation to Sessions
  @OneToMany(() => SessionTypeOrmEntity, (session) => session.user)
  sessions: SessionTypeOrmEntity[];

  // Domain methods
  makeDeleted(): void {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  updateEmail(email: string): void {
    if (email !== this.email) {
      this.isEmailConfirmed = false;
    }
    this.email = email;
  }

  confirmEmail(): void {
    this.isEmailConfirmed = true;
  }

  updateConfirmationCode(confirmationCode: string, expirationDate: Date): void {
    this.confirmationCode = confirmationCode;
    this.expirationDate = expirationDate;
  }

  updatePasswordAndConfirmEmail(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.isEmailConfirmed = true;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isEmailConfirmationExpired(): boolean {
    if (!this.expirationDate) {
      return false;
    }
    return new Date() > this.expirationDate;
  }
} 