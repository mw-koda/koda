import { Injectable } from '@nestjs/common';
import { createTypedAuthGuard } from './auth-guard.factory';

const GithubAuthGuardBase = createTypedAuthGuard('github');

@Injectable()
export class GithubAuthGuard extends GithubAuthGuardBase {}
