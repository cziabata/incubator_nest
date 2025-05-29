import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { NotFoundDomainException, ForbiddenDomainException } from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class RefreshTokenTypeOrmGuard extends AuthGuard('refresh-token-typeorm') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get the request
      const request = context.switchToHttp().getRequest<Request>();
      
      // Check if refresh token is present in cookies
      if (!request.cookies?.refreshToken) {
        throw new UnauthorizedException('Refresh token is missing');
      }

      // Call parent's canActivate
      const result = (await super.canActivate(context)) as boolean;
      
      // If authentication succeeded, Passport will have attached user info to the request
      return result;
    } catch (error) {
      // Don't transform NotFound and Forbidden exceptions
      if (error instanceof NotFoundDomainException || 
          error instanceof ForbiddenDomainException) {
        throw error;
      }
      
      // Transform other errors to 401 Unauthorized
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 