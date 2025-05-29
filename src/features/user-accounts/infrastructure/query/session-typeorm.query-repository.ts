import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SessionTypeOrmEntity } from '../../domain/session-typeorm.entity';
import {
  ActiveDeviceSessionData,
  SessionViewData,
  SessionViewDto,
  SessionSearchFilters,
  SessionSortOptions,
  SessionPaginationOptions,
  PaginatedSessionsResult,
} from '../../domain/types/session-typeorm.types';

@Injectable()
export class SessionTypeOrmQueryRepository {
  constructor(
    @InjectRepository(SessionTypeOrmEntity)
    private readonly sessionRepository: Repository<SessionTypeOrmEntity>,
  ) {}

  async getAllActiveDevices(userId: string): Promise<SessionViewDto[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        exp: MoreThan(new Date()),
      },
      order: { iat: 'DESC' },
    });

    return sessions.map(session => ({
      deviceId: session.deviceId,
      ip: session.ip,
      lastActiveDate: session.iat,
      title: session.deviceName,
    }));
  }

  async getActiveDeviceById(deviceId: string): Promise<SessionViewDto | null> {
    const session = await this.sessionRepository.findOne({
      where: {
        deviceId,
        exp: MoreThan(new Date()),
      },
    });

    if (!session) {
      return null;
    }

    return {
      deviceId: session.deviceId,
      ip: session.ip,
      lastActiveDate: session.iat,
      title: session.deviceName,
    };
  }

  async getActiveDeviceByIatAndUserId(
    iat: string,
    userId: string,
  ): Promise<any | null> {
    const session = await this.sessionRepository.findOne({
      where: {
        iat: new Date(iat),
        userId,
        exp: MoreThan(new Date()),
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      deviceId: session.deviceId,
      userId: session.userId,
      iat: session.iat,
      deviceName: session.deviceName,
      ip: session.ip,
      exp: session.exp,
    };
  }

  async getSessionById(id: number): Promise<SessionViewData | null> {
    const session = await this.sessionRepository.findOne({
      where: { id },
    });

    if (!session) {
      return null;
    }

    return this.mapToViewData(session);
  }

  async getSessionByIdOrNotFoundFail(id: number): Promise<SessionViewData> {
    const session = await this.getSessionById(id);

    if (!session) {
      throw new NotFoundException('session not found');
    }

    return session;
  }

  async getSessionByDeviceId(deviceId: string): Promise<SessionViewData | null> {
    const session = await this.sessionRepository.findOne({
      where: { deviceId },
    });

    if (!session) {
      return null;
    }

    return this.mapToViewData(session);
  }

  async getActiveSessionsForUser(userId: string): Promise<SessionViewData[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        exp: MoreThan(new Date()),
      },
      order: { iat: 'DESC' },
    });

    return sessions.map(session => this.mapToViewData(session));
  }

  async getAllSessionsWithFilters(
    filters: SessionSearchFilters,
    sortOptions: SessionSortOptions,
    paginationOptions: SessionPaginationOptions,
  ): Promise<PaginatedSessionsResult<SessionViewData>> {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');

    // Apply filters
    this.addSearchFilters(queryBuilder, filters);

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply sorting and pagination
    queryBuilder
      .orderBy(`session.${sortOptions.sortBy}`, sortOptions.sortDirection)
      .limit(paginationOptions.pageSize)
      .offset((paginationOptions.page - 1) * paginationOptions.pageSize);

    const sessions = await queryBuilder.getMany();

    // Map to view data
    const items = sessions.map(session => this.mapToViewData(session));

    return {
      items,
      totalCount,
      page: paginationOptions.page,
      pageSize: paginationOptions.pageSize,
      pagesCount: Math.ceil(totalCount / paginationOptions.pageSize),
    };
  }

  async countActiveSessionsForUser(userId: string): Promise<number> {
    return this.sessionRepository.count({
      where: {
        userId,
        exp: MoreThan(new Date()),
      },
    });
  }

  async isDeviceSessionActive(deviceId: string): Promise<boolean> {
    const count = await this.sessionRepository.count({
      where: {
        deviceId,
        exp: MoreThan(new Date()),
      },
    });

    return count > 0;
  }

  async findExpiredSessions(): Promise<SessionViewData[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        exp: MoreThan(new Date()),
      },
      order: { exp: 'ASC' },
    });

    return sessions.map(session => this.mapToViewData(session));
  }

  private addSearchFilters(queryBuilder: any, filters: SessionSearchFilters): void {
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
  }

  private mapToViewData(session: SessionTypeOrmEntity): SessionViewData {
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