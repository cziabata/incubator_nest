import {
  Controller,
  Get,
  HttpCode,
  UseGuards,
  Req,
  Delete,
  Param,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { SessionTypeOrmQueryRepository } from '../infrastructure/query/session-typeorm.query-repository';
import { RefreshTokenTypeOrmGuard } from '../guards/bearer/refresh-token-typeorm.guard';
import { SessionTypeOrmService } from '../application/session-typeorm.service';

@Controller('security/devices-typeorm')
export class SessionTypeOrmController {
  constructor(
    private sessionTypeOrmQueryRepository: SessionTypeOrmQueryRepository,
    private sessionTypeOrmService: SessionTypeOrmService,
  ) {}

  @UseGuards(RefreshTokenTypeOrmGuard)
  @Get()
  @HttpCode(200)
  async getAllActiveDevices(@Req() req) {
    try {
      if (!req.user || !req.user.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      
      const userId = req.user.id;
      return await this.sessionTypeOrmQueryRepository.getAllActiveDevices(userId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(RefreshTokenTypeOrmGuard)
  @Delete()
  @HttpCode(204)
  async deleteAllActiveSessions(@Req() req): Promise<void> {
    const userId = req.user.id;
    const deviceId = req.user.session?.deviceId;
    await this.sessionTypeOrmService.deleteAllActiveSessions(userId, deviceId);
  }

  @UseGuards(RefreshTokenTypeOrmGuard)
  @Delete(':deviceId')
  @HttpCode(204)
  async deleteActiveSessionById(
    @Req() req,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.sessionTypeOrmService.deleteActiveSessionById(deviceId, userId);
  }
} 