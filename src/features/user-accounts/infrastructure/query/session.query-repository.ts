import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../domain/session.entity';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';

@Injectable()
export class SessionQueryRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  async getAllActiveDevices(userId: string): Promise<SessionViewDto[]> {
    const sessions = await this.SessionModel.find({
      user_id: userId,
    });
    const activeSessions = sessions.filter(
      (session) => session.exp.getTime() > Date.now(),
    );
    return activeSessions.map((s) => SessionViewDto.mapToView(s));
  }

  async getActiveDeviceById(deviceId: string): Promise<SessionViewDto | null> {
    const session = await this.SessionModel.findOne({ device_id: deviceId });
    if (!session) {
      return null;
    }
    return SessionViewDto.mapToView(session);
  }

  async getActiveDeviceByIatAndUserId(
    iat: string,
    userId: string,
  ): Promise<Session | null> {
    const session = await this.SessionModel.findOne({ iat, user_id: userId });
    if (!session) {
      return null;
    }
    return session;
  }
}
