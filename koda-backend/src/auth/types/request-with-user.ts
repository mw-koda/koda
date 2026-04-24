import { Request } from 'express';
import type { UserRecord } from '../auth.service';

export interface RequestWithUser extends Request {
  user: UserRecord;
}
