import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../infrastructure/session.repository';
import { SessionQueryRepository } from '../infrastructure/query/session.query-repository';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionModelType, Session } from '../domain/session.entity';
import { UpdateSessionDomainDto } from '../domain/dto/update-session.domain.dto';
import { InjectModel } from '@nestjs/mongoose';

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
  async deleteActiveSessionById(
    deviceId: string,
    userId: string,
  ): Promise<number> {
    const isSessionsExists =
      await this.sessionQueryRepository.getActiveDeviceById(deviceId);
    if (!isSessionsExists) {
      return 404;
    }
    const isUserHasSuchDevice =
      await this.sessionRepository.checkIfUserHasSuchDevice(userId, deviceId);
    if (!isUserHasSuchDevice) {
      return 403;
    }
    const result = await this.sessionRepository.deleteActiveSessionByDeviceId(
      userId,
      deviceId,
    );
    if (!result) {
      return 500;
    }
    return 204;
  }
  async createSession(newSession: CreateSessionDto) {
    const session = this.sessionModel.createInstance(newSession);
    await this.sessionRepository.createSession(session);
  }
  async updateSession(
    device_id: string,
    updates: UpdateSessionDomainDto,
  ): Promise<boolean> {
    const result = await this.sessionRepository.updateSession(
      device_id,
      updates,
    );
    return result;
  }
  async generateDeviceId(): Promise<string> {
    return uuidv4();
  }
}
