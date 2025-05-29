import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { UsersTypeOrmRepository } from '../../infrastructure/users-typeorm.repository';
import { BlacklistedRefreshTokenTypeOrmRepository } from '../../infrastructure/blacklisted-refresh-token-typeorm.repository';
import { SessionTypeOrmQueryRepository } from '../../infrastructure/query/session-typeorm.query-repository';

@Injectable()
export class RefreshTokenTypeOrmStrategy extends PassportStrategy(
  Strategy,
  'refresh-token-typeorm',
) {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersTypeOrmRepository: UsersTypeOrmRepository,
    private readonly refreshTokenTypeOrmRepository: BlacklistedRefreshTokenTypeOrmRepository,
    private readonly sessionsTypeOrmQueryRepository: SessionTypeOrmQueryRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Try getting from cookies parsed by cookie-parser
          if (request.cookies && request.cookies.refreshToken) {
            return request.cookies.refreshToken;
          }

          // Fallback: manually parse cookie header if cookie-parser didn't work
          const cookieHeader = request.headers.cookie;
          if (cookieHeader) {
            const cookies: Record<string, string> = cookieHeader
              .split(';')
              .reduce(
                (acc, cookie) => {
                  const [key, value] = cookie.trim().split('=');
                  acc[key] = value;
                  return acc;
                },
                {} as Record<string, string>,
              );

            if (cookies.refreshToken) {
              return cookies.refreshToken;
            }
          }

          return null;
        },
      ]),
      secretOrKey: 'refresh-token-secret', // TODO: Move to env
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // Check if refresh token is present in the request
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      // Check payload structure
      const { id, deviceId } = payload;
      if (!id) {
        throw new UnauthorizedException('Invalid token: missing user id');
      }

      // Check if user exists
      const user = await this.usersTypeOrmRepository.findByIdOrNotFoundFail(id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.refreshTokenTypeOrmRepository.doesExist(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      // Check if token is expired
      const exp = payload.exp;
      if (exp && Date.now() >= exp * 1000) {
        throw new UnauthorizedException('Token expired');
      }

      // Check if user has any active sessions
      const allSessions = await this.sessionsTypeOrmQueryRepository.getAllActiveDevices(id);
      if (allSessions.length === 0) {
        throw new UnauthorizedException('No active sessions found');
      }

      // Return user data with session information
      return {
        id,
        session: {
          iat: payload.iat
            ? new Date(payload.iat * 1000).toISOString()
            : new Date().toISOString(),
          deviceId: deviceId || 'unknown',
        },
      };
    } catch (error) {
      // Handle specific domain exceptions
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
} 