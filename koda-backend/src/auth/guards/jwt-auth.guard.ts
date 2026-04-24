import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createTypedAuthGuard } from './auth-guard.factory';

const JwtAuthGuardBase = createTypedAuthGuard('jwt');

@Injectable()
export class JwtAuthGuard extends JwtAuthGuardBase {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message = info?.message || 'Unauthorized';
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}
