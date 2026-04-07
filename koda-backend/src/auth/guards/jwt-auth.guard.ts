import { Injectable } from '@nestjs/common';
import { createTypedAuthGuard } from './auth-guard.factory';

const JwtAuthGuardBase = createTypedAuthGuard('jwt');

@Injectable()
export class JwtAuthGuard extends JwtAuthGuardBase {}
