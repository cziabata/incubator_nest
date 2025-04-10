import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('refresh-token') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Add refresh token to the request object
    const request = context.switchToHttp().getRequest<Request>();

    // Call parent's canActivate
    const result = (await super.canActivate(context)) as boolean;

    // If authentication succeeded, Passport will have attached user info to the request
    return result;
  }
}
