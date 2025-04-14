import {
  Controller,
  Get,
  HttpCode,
  UseGuards,
  Req,
  Delete,
  Param,
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
  async getAllActiveDevices(@Req() req): Promise<void> {
    const userId = req.user.id;
    await this.sessionQueryRepository.getAllActiveDevices(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Delete()
  @HttpCode(204)
  async deleteAllActiveSessions(@Req() req): Promise<void> {
    const userId = req.user.id;
    const deviceId = req.session?.deviceId as string;
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
