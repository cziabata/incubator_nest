import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../../infrastructure/users.repository';
import { BlacklistedRefreshTokenRepository } from '../../infrastructure/blacklisted-refresh-token.repository';
import { SessionQueryRepository } from '../../infrastructure/query/session.query-repository';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokenRepository: BlacklistedRefreshTokenRepository,
    private readonly sessionsQueryRepository: SessionQueryRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      secretOrKey: 'refresh-token-secret', // TODO: Move to env
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { userId, exp, iat, deviceId } = payload;

    // Check if session exists and is valid
    const session =
      await this.sessionsQueryRepository.getActiveDeviceByIatAndUserId(
        new Date(iat * 1000).toISOString(),
        userId,
      );

    if (!session || (exp && exp > session.exp.getTime())) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check if token is blacklisted
    const isBlacklisted =
      await this.refreshTokenRepository.doesExist(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token is blacklisted');
    }

    // Check if token is expired
    if (exp && Date.now() >= exp * 1000) {
      throw new UnauthorizedException('Token expired');
    }

    // Check if user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Set session data to request
    return {
      id: userId,
      session: {
        iat: new Date(iat * 1000).toISOString(),
        deviceId,
      },
    };
  }
}
