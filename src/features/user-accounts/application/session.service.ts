import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../infrastructure/session.repository';
import { SessionQueryRepository } from '../infrastructure/query/session.query-repository';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionModelType, Session } from '../domain/session.entity';
import { UpdateSessionDomainDto } from '../domain/dto/update-session.domain.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private sessionModel: SessionModelType,
    private sessionRepository: SessionRepository,
    private sessionQueryRepository: SessionQueryRepository,
  ) {}

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const result = await this.sessionRepository.deleteAllActiveSessions(
      userId,
      deviceId,
    );
    return result;
  }
  async getAllActiveSessions(userId: string) {
    return await this.sessionQueryRepository.getAllActiveDevices(userId);
  }
  async deleteActiveSessionById(
    deviceId: string,
    userId: string,
  ): Promise<void> {
    const sessionExists = await this.sessionQueryRepository.getActiveDeviceById(deviceId);
    if (!sessionExists) {
      throw NotFoundDomainException.create(
        `Device with id ${deviceId} not found`,
      );
    }
    
    const isUserHasSuchDevice =
      await this.sessionRepository.checkIfUserHasSuchDevice(userId, deviceId);
    if (!isUserHasSuchDevice) {
      throw ForbiddenDomainException.create(
        'user has no such device, forbidden',
      );
    }
    
    const result = await this.sessionRepository.deleteActiveSessionByDeviceId(
      userId,
      deviceId,
    );
    if (!result) {
      throw BadRequestDomainException.create(
        'internal server error, bad request',
      );
    }
  }
  async createSession(newSession: CreateSessionDto) {
    const session = this.sessionModel.createInstance(newSession);
    await this.sessionRepository.createSession(session);
  }
  async updateSession(deviceId: string, dto: UpdateSessionDomainDto) {
    const result = await this.sessionRepository.updateSession(deviceId, {
      iat: dto.iat,
      exp: dto.exp,
    });
    
    if (!result) {
      throw NotFoundDomainException.create('Session not found');
    }
    
    return result;
  }
  async generateDeviceId(): Promise<string> {
    return uuidv4();
  }
}
