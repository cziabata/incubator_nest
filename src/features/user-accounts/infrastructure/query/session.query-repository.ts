import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Session, SessionModelType } from '../../domain/session.entity';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class SessionQueryRepository {
  constructor(
    // @InjectModel(Session.name)
    // private SessionModel: SessionModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getAllActiveDevices(userId: string): Promise<SessionViewDto[]> {
    const sqlQuery = `
      SELECT 
        id, 
        device_id as "deviceId", 
        iat as "lastActiveDate", 
        device_name as "title", 
        ip
      FROM sessions
      WHERE user_id = $1 AND exp > NOW()
    `;
    
    const sessions = await this.dataSource.query(sqlQuery, [userId]);
    
    return sessions.map((session) => ({
      deviceId: session.deviceId,
      ip: session.ip,
      lastActiveDate: session.lastActiveDate,
      title: session.title
    }));
  }

  async getActiveDeviceById(deviceId: string): Promise<SessionViewDto | null> {
    const sqlQuery = `
      SELECT 
        id, 
        device_id as "deviceId", 
        iat as "lastActiveDate", 
        device_name as "title", 
        ip
      FROM sessions
      WHERE device_id = $1 AND exp > NOW()
    `;
    
    const sessions = await this.dataSource.query(sqlQuery, [deviceId]);
    
    if (!sessions || sessions.length === 0) {
      return null;
    }
    
    const session = sessions[0];
    return {
      deviceId: session.deviceId,
      ip: session.ip,
      lastActiveDate: session.lastActiveDate,
      title: session.title
    };
  }

  async getActiveDeviceByIatAndUserId(
    iat: string,
    userId: string,
  ): Promise<any | null> {
    const sqlQuery = `
      SELECT 
        id, 
        device_id as "deviceId", 
        user_id as "userId",
        iat, 
        device_name as "deviceName", 
        ip,
        exp
      FROM sessions
      WHERE iat = $1 AND user_id = $2 AND exp > NOW()
    `;
    
    const sessions = await this.dataSource.query(sqlQuery, [iat, userId]);
    
    if (!sessions || sessions.length === 0) {
      return null;
    }
    
    return sessions[0];
  }
}
