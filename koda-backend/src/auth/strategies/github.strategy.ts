import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import type { UserRecord } from '../auth.service';

interface GithubUser {
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  accessToken: string;
}

const GithubPassportStrategy = PassportStrategy(Strategy, 'github');

@Injectable()
export class GithubStrategy extends GithubPassportStrategy {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['read:user', 'user:email'],
    });
  }

  // Explicit return type added: passport-github2 does not expose a typed done()
  // callback, so we return the Promise directly and let Passport resolve it.
  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<UserRecord> {
    const { id, username, emails, photos } = profile;

    const githubUser: GithubUser = {
      githubId: id,
      username: username ?? '',
      // emails / photos come from passport-github2 as optional arrays of
      // objects; value is always a string when present, so the cast is safe.
      email: emails?.[0]?.value ?? null,
      avatarUrl: photos?.[0]?.value ?? null,
      accessToken,
    };

    return this.authService.findOrCreateUser(githubUser);
  }
}
