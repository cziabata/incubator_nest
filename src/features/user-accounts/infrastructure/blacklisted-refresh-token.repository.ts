import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import {
//   BlacklistedToken,
//   BlacklistedTokenDocument,
//   BlacklistedTokenModelType,
// } from '../domain/blacklisted-token.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class BlacklistedRefreshTokenRepository {
  constructor(
    // @InjectModel(BlacklistedToken.name)
    // private BlacklistedTokenModel: BlacklistedTokenModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async save(token: string): Promise<void> {
    const sqlQuery = `
      INSERT INTO refresh_tokens_black_list (token, created_at)
      VALUES ($1, CURRENT_DATE)
    `;
    
    await this.dataSource.query(sqlQuery, [token]);
  }

  async doesExist(token: string): Promise<boolean> {
    const sqlQuery = `
      SELECT COUNT(*) as count
      FROM refresh_tokens_black_list
      WHERE token = $1
    `;
    
    const result = await this.dataSource.query(sqlQuery, [token]);
    
    return result[0].count > 0;
  }
}
