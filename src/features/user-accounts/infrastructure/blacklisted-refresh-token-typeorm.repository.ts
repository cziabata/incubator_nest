import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedRefreshTokenTypeOrmEntity } from '../domain/blacklisted-refresh-token-typeorm.entity';
import { CreateBlacklistedTokenTypeOrmDto } from '../domain/types/blacklisted-refresh-token-typeorm.types';

@Injectable()
export class BlacklistedRefreshTokenTypeOrmRepository {
  constructor(
    @InjectRepository(BlacklistedRefreshTokenTypeOrmEntity)
    private readonly blacklistedTokenRepository: Repository<BlacklistedRefreshTokenTypeOrmEntity>,
  ) {}

  async save(token: string): Promise<void> {
    const blacklistedToken = this.blacklistedTokenRepository.create({
      token,
    });
    
    await this.blacklistedTokenRepository.save(blacklistedToken);
  }

  async doesExist(token: string): Promise<boolean> {
    const count = await this.blacklistedTokenRepository.count({
      where: { token },
    });
    
    return count > 0;
  }

  async deleteToken(token: string): Promise<void> {
    await this.blacklistedTokenRepository.delete({ token });
  }

  async findByToken(token: string): Promise<BlacklistedRefreshTokenTypeOrmEntity | null> {
    return await this.blacklistedTokenRepository.findOne({
      where: { token },
    });
  }

  async getAllTokens(): Promise<BlacklistedRefreshTokenTypeOrmEntity[]> {
    return await this.blacklistedTokenRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async deleteExpiredTokens(beforeDate: Date): Promise<void> {
    await this.blacklistedTokenRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :beforeDate', { beforeDate })
      .execute();
  }
} 