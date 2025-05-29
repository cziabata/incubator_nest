import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SessionTypeOrmRepository } from '../infrastructure/session-typeorm.repository';
import { UsersTypeOrmRepository } from '../infrastructure/users-typeorm.repository';
import {
  CreateSessionTypeOrmDto,
  UpdateSessionTypeOrmDto,
  ActiveDeviceSessionData,
  SessionViewData,
} from '../domain/types/session-typeorm.types';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '../../../core/exceptions/domain-exceptions';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SessionTypeOrmService {
  constructor(
    private sessionTypeOrmRepository: SessionTypeOrmRepository,
    private usersTypeOrmRepository: UsersTypeOrmRepository,
  ) {}

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    // Check if user exists
    const user = await this.usersTypeOrmRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.sessionTypeOrmRepository.deleteAllSessionsExceptCurrent(userId, deviceId);
    return true;
  }

  async getAllActiveSessions(userId: string) {
    return await this.sessionTypeOrmRepository.findAllActiveDevicesForUser(userId);
  }

  async getAllActiveDevicesForUser(userId: string): Promise<ActiveDeviceSessionData[]> {
    // Check if user exists
    const user = await this.usersTypeOrmRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sessionTypeOrmRepository.findAllActiveDevicesForUser(userId);
  }

  async deleteActiveSessionById(
    deviceId: string,
    userId: string,
  ): Promise<void> {
    // Check if session exists
    const sessionExists = await this.sessionTypeOrmRepository.findByDeviceId(deviceId);
    if (!sessionExists) {
      throw NotFoundDomainException.create(
        `Device with id ${deviceId} not found`,
      );
    }

    // Check if user owns this device
    const isUserHasSuchDevice = await this.checkIfUserHasSuchDevice(userId, deviceId);
    if (!isUserHasSuchDevice) {
      throw ForbiddenDomainException.create(
        'user has no such device, forbidden',
      );
    }

    await this.sessionTypeOrmRepository.deleteSession(deviceId);
  }

  async createSession(newSession: CreateSessionTypeOrmDto): Promise<number> {
    // Check if user exists
    const user = await this.usersTypeOrmRepository.findById(newSession.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if session with this deviceId already exists and delete it
    const existingSession = await this.sessionTypeOrmRepository.findByDeviceId(newSession.deviceId);
    if (existingSession) {
      await this.sessionTypeOrmRepository.deleteSession(newSession.deviceId);
    }

    return this.sessionTypeOrmRepository.createSession(newSession);
  }

  async updateSession(deviceId: string, updates: UpdateSessionTypeOrmDto): Promise<boolean> {
    try {
      await this.sessionTypeOrmRepository.updateSession(deviceId, updates);
      return true;
    } catch (error) {
      throw NotFoundDomainException.create('Session not found');
    }
  }

  async updateSessionTokens(
    deviceId: string,
    newIat: Date,
    newExp: Date,
  ): Promise<void> {
    const updateDto: UpdateSessionTypeOrmDto = {
      iat: newIat,
      exp: newExp,
    };

    const success = await this.updateSession(deviceId, updateDto);
    if (!success) {
      throw NotFoundDomainException.create('Failed to update session');
    }
  }

  async validateSession(deviceId: string): Promise<SessionViewData> {
    const session = await this.sessionTypeOrmRepository.findByDeviceId(deviceId);
    
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (!session.isActive()) {
      throw new UnauthorizedException('Session expired');
    }

    return this.sessionTypeOrmRepository.mapToViewData(session);
  }

  async deleteSession(deviceId: string): Promise<void> {
    await this.sessionTypeOrmRepository.deleteSession(deviceId);
  }

  async deleteSessionByUserIdAndDeviceId(userId: string, deviceId: string): Promise<void> {
    await this.sessionTypeOrmRepository.deleteSessionByUserIdAndDeviceId(userId, deviceId);
  }

  async isSessionActive(deviceId: string): Promise<boolean> {
    return this.sessionTypeOrmRepository.isSessionActive(deviceId);
  }

  async getSessionByDeviceId(deviceId: string): Promise<SessionViewData | null> {
    const session = await this.sessionTypeOrmRepository.findByDeviceId(deviceId);
    
    if (!session) {
      return null;
    }

    return this.sessionTypeOrmRepository.mapToViewData(session);
  }

  async deleteAllExpiredSessions(): Promise<void> {
    await this.sessionTypeOrmRepository.deleteAllExpiredSessions();
  }

  async deleteAllSessionsByUserId(userId: string): Promise<void> {
    await this.sessionTypeOrmRepository.deleteAllSessionsByUserId(userId);
  }

  async countActiveSessionsForUser(userId: string): Promise<number> {
    return this.sessionTypeOrmRepository.countActiveSessions(userId);
  }

  async generateDeviceId(): Promise<string> {
    return randomUUID();
  }

  async checkIfUserHasSuchDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const session = await this.sessionTypeOrmRepository.findByUserIdAndDeviceId(userId, deviceId);
    return session !== null;
  }

  // Business logic methods
  async validateUserSessionOwnership(userId: string, deviceId: string): Promise<void> {
    const session = await this.sessionTypeOrmRepository.findByUserIdAndDeviceId(userId, deviceId);
    
    if (!session) {
      throw new UnauthorizedException('Session does not belong to user');
    }

    if (!session.isActive()) {
      throw new UnauthorizedException('Session expired');
    }
  }

  async refreshSession(
    userId: string,
    deviceId: string,
    newIat: Date,
    newExp: Date,
  ): Promise<void> {
    // Validate that session belongs to user and is active
    await this.validateUserSessionOwnership(userId, deviceId);

    // Update session with new timestamps
    await this.updateSessionTokens(deviceId, newIat, newExp);
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Get count of expired sessions before deletion
    const expiredSessions = await this.sessionTypeOrmRepository.findSessionsWithFilters({
      isActive: false,
    });

    const expiredCount = expiredSessions.length;

    // Delete all expired sessions
    await this.sessionTypeOrmRepository.deleteAllExpiredSessions();

    return expiredCount;
  }
} 