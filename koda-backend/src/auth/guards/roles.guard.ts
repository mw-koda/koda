import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles metadata means the route is open to all authenticated users.
    if (requiredRoles === undefined || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    // `user` is attached by the JwtAuthGuard; if it is absent the request
    // was not authenticated — treat it as forbidden rather than unauthorized
    // so we don't leak which routes require auth.
    if (user === undefined || user === null) {
      throw new ForbiddenException('No authenticated user');
    }

    // ADMIN has full access to all role-protected endpoints.
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
