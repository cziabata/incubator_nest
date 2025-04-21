import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import {
//   Session,
//   SessionDocument,
//   SessionModelType,
// } from '../domain/session.entity';
import { UpdateSessionInputDto } from '../api/input-dto/update-session.input-dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class SessionRepository {
  constructor(
    // @InjectModel(Session.name)
    // private SessionModel: SessionModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async createSession(newSession: CreateSessionDto) {
    // Проверяем, существует ли уже сессия
    const checkQuery = `
      SELECT id FROM sessions 
      WHERE user_id = $1 AND device_id = $2
    `;
    
    const existingSession = await this.dataSource.query(checkQuery, [
      newSession.user_id, 
      newSession.device_id
    ]);

    if (existingSession && existingSession.length > 0) {
      // Обновляем существующую сессию
      const updateQuery = `
        UPDATE sessions 
        SET 
          iat = $1, 
          exp = $2, 
          device_name = $3, 
          ip = $4,
          updated_at = NOW()
        WHERE user_id = $5 AND device_id = $6
      `;
      
      await this.dataSource.query(updateQuery, [
        newSession.iat,
        newSession.exp,
        newSession.device_name,
        newSession.ip,
        newSession.user_id,
        newSession.device_id
      ]);
    } else {
      // Создаем новую сессию
      const insertQuery = `
        INSERT INTO sessions 
        (user_id, device_id, iat, device_name, ip, exp, created_at, updated_at) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;
      
      await this.dataSource.query(insertQuery, [
        newSession.user_id,
        newSession.device_id,
        newSession.iat,
        newSession.device_name,
        newSession.ip,
        newSession.exp
      ]);
    }
  }

  async deleteAllActiveSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const query = `
      DELETE FROM sessions 
      WHERE user_id = $1 AND device_id != $2
    `;
    
    const result = await this.dataSource.query(query, [userId, deviceId]);
    
    return result[1] > 0;
  }

  async deleteActiveSessionByDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const query = `
      DELETE FROM sessions 
      WHERE user_id = $1 AND device_id = $2
    `;
    
    const result = await this.dataSource.query(query, [userId, deviceId]);
    
    return result[1] > 0;
  }

  async checkIfUserHasSuchDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM sessions 
      WHERE user_id = $1 AND device_id = $2
    `;
    
    const result = await this.dataSource.query(query, [userId, deviceId]);
    
    return result[0].count > 0;
  }

  async updateSession(
    deviceId: string,
    updates: UpdateSessionInputDto,
  ): Promise<boolean> {
    const query = `
      UPDATE sessions 
      SET 
        iat = $1, 
        exp = $2,
        updated_at = NOW()
      WHERE device_id = $3
    `;
    
    const result = await this.dataSource.query(query, [
      updates.iat,
      updates.exp,
      deviceId
    ]);
    
    return result[1] > 0;
  }
}
