import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';
import { UpdateSessionInputDto } from '../api/input-dto/update-session.input-dto';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  async createSession(newSession: SessionDocument) {
    await newSession.save();
  }

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const result = await this.SessionModel.deleteMany({
      user_id: userId,
      device_id: { $ne: deviceId },
    });
    return result.acknowledged;
  }

  async deleteActiveSessionByDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const result = await this.SessionModel.deleteOne({
      user_id: userId,
      device_id: deviceId,
    });
    return result.acknowledged;
  }

  async checkIfUserHasSuchDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const result = await this.SessionModel.findOne({
      user_id: userId,
      device_id: deviceId,
    });
    return !!result;
  }

  async updateSession(
    deviceId: string,
    updates: UpdateSessionInputDto,
  ): Promise<boolean> {
    const result = await this.SessionModel.updateOne(
      { device_id: deviceId },
      { $set: updates },
    );
    return result.acknowledged;
  }
}
