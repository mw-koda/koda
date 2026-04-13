import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { JwtPayload, UserRecord } from '../auth.service';
import { USER_SELECT_FIELDS } from '../users/user-select';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserRecord> {
    const client = this.supabaseService.getClient();

    const response = await client
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('id', payload.sub)
      .single(); // explicit row shape cast to avoid unsafe any from the generic Supabase client

    if (response.error || !response.data) {
      throw new UnauthorizedException('User not found');
    }

    return response.data;
  }
}
