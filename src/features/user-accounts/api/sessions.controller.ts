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
import { SessionQueryRepository } from '../infrastructure/query/session.query-repository';
import { RefreshTokenGuard } from '../guards/bearer/refresh-token.guard';
import { SessionService } from '../application/session.service';

@Controller('security/devices')
export class SessionController {
  constructor(
    private sessionQueryRepository: SessionQueryRepository,
    private sesionService: SessionService,
  ) {}

  @UseGuards(RefreshTokenGuard)
  @Get()
  @HttpCode(200)
  async getAllActiveDevices(@Req() req) {
    try {
      if (!req.user || !req.user.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      
      const userId = req.user.id;
      return await this.sessionQueryRepository.getAllActiveDevices(userId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(RefreshTokenGuard)
  @Delete()
  @HttpCode(204)
  async deleteAllActiveSessions(@Req() req): Promise<void> {
    const userId = req.user.id;
    const deviceId = req.user.session?.deviceId;
    await this.sesionService.deleteAllActiveSessions(userId, deviceId);
  }

  @UseGuards(RefreshTokenGuard)
  @Delete(':deviceId')
  @HttpCode(204)
  async deleteActiveSessionById(
    @Req() req,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.sesionService.deleteActiveSessionById(deviceId, userId);
  }
}
