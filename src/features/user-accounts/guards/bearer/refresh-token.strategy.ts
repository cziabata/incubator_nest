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
          // Try getting from cookies parsed by cookie-parser
          if (request.cookies && request.cookies.refreshToken) {
            return request.cookies.refreshToken;
          }
          
          // Fallback: manually parse cookie header if cookie-parser didn't work
          const cookieHeader = request.headers.cookie;
          if (cookieHeader) {
            const cookies: Record<string, string> = cookieHeader.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
            
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
    // Обязательно проверим наличие токена в запросе
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      // Проверяем структуру payload
      const { id, deviceId } = payload;
      if (!id) {
        throw new UnauthorizedException('Invalid token: missing user id');
      }

      // Проверяем наличие пользователя
      const user = await this.usersRepository.findById(id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Проверяем, находится ли токен в черном списке
      const isBlacklisted = await this.refreshTokenRepository.doesExist(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      // Проверяем срок действия токена
      const exp = payload.exp;
      if (exp && Date.now() >= exp * 1000) {
        throw new UnauthorizedException('Token expired');
      }

      // Проверяем наличие активных сессий
      const allSessions = await this.sessionsQueryRepository.getAllActiveDevices(id);
      if (allSessions.length === 0) {
        throw new UnauthorizedException('No active sessions found');
      }

      // Возвращаем данные пользователя с информацией о сессии
      return {
        id,
        session: {
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
          deviceId: deviceId || 'unknown',
        },
      };
    } catch (error) {
      // Важно перехватить и переклассифицировать все ошибки как UnauthorizedException
      // чтобы тесты получали ожидаемый код 401
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
