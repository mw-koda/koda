import type { Type } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function createTypedAuthGuard(strategy: string): Type<object> {
  return AuthGuard(strategy) as unknown as Type<object>;
}
