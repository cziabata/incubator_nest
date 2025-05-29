import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { SessionTypeOrmEntity } from '../domain/session-typeorm.entity';
import {
  CreateSessionTypeOrmDto,
  UpdateSessionTypeOrmDto,
  SessionViewData,
  ActiveDeviceSessionData,
  SessionSearchFilters,
} from '../domain/types/session-typeorm.types';
import { NotFoundDomainException } from '../../../core/exceptions/domain-exceptions';

@Injectable()
export class SessionTypeOrmRepository {
  constructor(
    @InjectRepository(SessionTypeOrmEntity)
    private readonly sessionRepository: Repository<SessionTypeOrmEntity>,
  ) {}

  async createSession(dto: CreateSessionTypeOrmDto): Promise<number> {
    const session = SessionTypeOrmEntity.create(
      dto.userId,
      dto.deviceId,
      dto.deviceName,
      dto.ip,
      dto.iat,
      dto.exp,
    );

    const savedSession = await this.sessionRepository.save(session);
    return savedSession.id;
  }

  async findByDeviceId(deviceId: string): Promise<SessionTypeOrmEntity | null> {
    return this.sessionRepository.findOne({
      where: { deviceId },
    });
  }

  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<SessionTypeOrmEntity | null> {
    return this.sessionRepository.findOne({
      where: { userId, deviceId },
    });
  }

  async findActiveSessionsByUserId(userId: string): Promise<SessionTypeOrmEntity[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        exp: MoreThan(new Date()),
      },
      order: { iat: 'DESC' },
    });
  }

  async findAllActiveDevicesForUser(userId: string): Promise<ActiveDeviceSessionData[]> {
    const sessions = await this.findActiveSessionsByUserId(userId);
    
    return sessions.map(session => ({
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      ip: session.ip,
      lastActiveDate: session.iat,
    }));
  }

  async updateSession(deviceId: string, dto: UpdateSessionTypeOrmDto): Promise<void> {
    const result = await this.sessionRepository.update(
      { deviceId },
      dto,
    );

    if (result.affected === 0) {
      throw NotFoundDomainException.create('session not found');
    }
  }

  async deleteSession(deviceId: string): Promise<void> {
    const result = await this.sessionRepository.delete({ deviceId });

    if (result.affected === 0) {
      throw NotFoundDomainException.create('session not found');
    }
  }

  async deleteSessionByUserIdAndDeviceId(userId: string, deviceId: string): Promise<void> {
    const result = await this.sessionRepository.delete({ userId, deviceId });

    if (result.affected === 0) {
      throw NotFoundDomainException.create('session not found');
    }
  }

  async deleteAllSessionsExceptCurrent(userId: string, currentDeviceId: string): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(SessionTypeOrmEntity)
      .where('userId = :userId', { userId })
      .andWhere('deviceId != :currentDeviceId', { currentDeviceId })
      .execute();
  }

  async deleteAllExpiredSessions(): Promise<void> {
    await this.sessionRepository.delete({
      exp: LessThan(new Date()),
    });
  }

  async deleteAllSessionsByUserId(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async isSessionActive(deviceId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { deviceId },
    });

    if (!session) {
      return false;
    }

    return session.isActive();
  }

  async getSessionById(id: number): Promise<SessionTypeOrmEntity | null> {
    return this.sessionRepository.findOne({
      where: { id },
    });
  }

  async getSessionByIdOrNotFoundFail(id: number): Promise<SessionTypeOrmEntity> {
    const session = await this.getSessionById(id);

    if (!session) {
      throw NotFoundDomainException.create('session not found');
    }

    return session;
  }

  async findSessionsWithFilters(filters: SessionSearchFilters): Promise<SessionTypeOrmEntity[]> {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');

    if (filters.userId) {
      queryBuilder.andWhere('session.userId = :userId', { userId: filters.userId });
    }

    if (filters.deviceId) {
      queryBuilder.andWhere('session.deviceId = :deviceId', { deviceId: filters.deviceId });
    }

    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        queryBuilder.andWhere('session.exp > :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('session.exp <= :now', { now: new Date() });
      }
    }

    if (filters.expiredBefore) {
      queryBuilder.andWhere('session.exp < :expiredBefore', { expiredBefore: filters.expiredBefore });
    }

    if (filters.expiredAfter) {
      queryBuilder.andWhere('session.exp > :expiredAfter', { expiredAfter: filters.expiredAfter });
    }

    return queryBuilder.getMany();
  }

  async countActiveSessions(userId: string): Promise<number> {
    return this.sessionRepository.count({
      where: {
        userId,
        exp: MoreThan(new Date()),
      },
    });
  }

  async save(session: SessionTypeOrmEntity): Promise<SessionTypeOrmEntity> {
    return this.sessionRepository.save(session);
  }

  async remove(session: SessionTypeOrmEntity): Promise<void> {
    await this.sessionRepository.remove(session);
  }

  // Helper method to map entity to view data
  mapToViewData(session: SessionTypeOrmEntity): SessionViewData {
    return {
      id: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      ip: session.ip,
      iat: session.iat,
      exp: session.exp,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
} 