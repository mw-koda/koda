import { Controller, Get, Req, UseGuards, Res, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { UserRecord } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

/** Shape of Express request after Passport attaches the authenticated user. */
type AuthenticatedRequest = Request & { user: UserRecord };

/** Response envelope for the /me endpoint. */
interface MeResponse {
  user: UserRecord;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Start GitHub authentication' })
  // Guard redirects to GitHub; this method body intentionally never executes.
  githubLogin(): void {
    return;
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Handle GitHub authentication callback' })
  githubCallback(@Req() req: AuthenticatedRequest, @Res() res: Response): void {
    const token = this.authService.generateToken({
      id: req.user.id,
      role: req.user.role,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    // res.redirect() returns void in Express typings, so the overall method
    // return type of void is correct.
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Get the authenticated user' })
  getMe(@CurrentUser() user: UserRecord): MeResponse {
    return { user };
  }
}
