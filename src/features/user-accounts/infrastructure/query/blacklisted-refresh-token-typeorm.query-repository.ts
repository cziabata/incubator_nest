import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedRefreshTokenTypeOrmEntity } from '../../domain/blacklisted-refresh-token-typeorm.entity';
import { BlacklistedTokenViewData } from '../../domain/types/blacklisted-refresh-token-typeorm.types';

@Injectable()
export class BlacklistedRefreshTokenTypeOrmQueryRepository {
  constructor(
    @InjectRepository(BlacklistedRefreshTokenTypeOrmEntity)
    private readonly blacklistedTokenRepository: Repository<BlacklistedRefreshTokenTypeOrmEntity>,
  ) {}

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const count = await this.blacklistedTokenRepository.count({
      where: { token },
    });
    
    return count > 0;
  }

  async getTokenById(id: number): Promise<BlacklistedTokenViewData | null> {
    const blacklistedToken = await this.blacklistedTokenRepository.findOne({
      where: { id },
    });

    if (!blacklistedToken) {
      return null;
    }

    return {
      id: blacklistedToken.id,
      token: blacklistedToken.token,
      created_at: blacklistedToken.created_at,
    };
  }

  async getAllBlacklistedTokens(): Promise<BlacklistedTokenViewData[]> {
    const tokens = await this.blacklistedTokenRepository.find({
      order: { created_at: 'DESC' },
    });

    return tokens.map(token => ({
      id: token.id,
      token: token.token,
      created_at: token.created_at,
    }));
  }

  async getTokensCount(): Promise<number> {
    return await this.blacklistedTokenRepository.count();
  }

  async findTokensByDateRange(startDate: Date, endDate: Date): Promise<BlacklistedTokenViewData[]> {
    const tokens = await this.blacklistedTokenRepository
      .createQueryBuilder('token')
      .where('token.created_at >= :startDate', { startDate })
      .andWhere('token.created_at <= :endDate', { endDate })
      .orderBy('token.created_at', 'DESC')
      .getMany();

    return tokens.map(token => ({
      id: token.id,
      token: token.token,
      created_at: token.created_at,
    }));
  }
} 