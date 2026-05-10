import { Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { SESSION_COOKIE_NAME } from '../common/auth/session.constants';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  AuthCallbackResponseDto,
  AuthMeResponseDto,
  GitHubLoginResponseDto,
} from './dto/auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github/login')
  @ApiOperation({
    summary: 'Generate GitHub OAuth login URL',
  })
  @ApiOkResponse({ type: GitHubLoginResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  getGitHubLoginUrl(): GitHubLoginResponseDto {
    return this.authService.buildGitHubLoginUrl();
  }

  @Get('github/callback')
  @ApiOperation({
    summary: 'Handle GitHub OAuth callback and issue local session cookie',
  })
  @ApiOkResponse({ type: AuthCallbackResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async handleGitHubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthCallbackResponseDto> {
    const user = await this.authService.handleGitHubCallback(code, state);

    response.cookie(SESSION_COOKIE_NAME, String(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    const redirectUrl =
      process.env.FRONTEND_OAUTH_SUCCESS_URL ?? 'http://localhost:5173/console';
    if (redirectUrl) {
      response.redirect(redirectUrl);
      return {
        success: true,
        user: {
          userId: user.id,
          login: user.login,
          email: user.email ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
        },
      };
    }

    return {
      success: true,
      user: {
        userId: user.id,
        login: user.login,
        email: user.email ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
      },
    };
  }

  @Get('me')
  @ApiCookieAuth(SESSION_COOKIE_NAME)
  @ApiOperation({
    summary: 'Get current authenticated user from local cookie session',
  })
  @ApiOkResponse({ type: AuthMeResponseDto })
  async getMe(@CurrentUserId() userId: number): Promise<AuthMeResponseDto> {
    const user = await this.authService.getMe(userId);
    return {
      userId: user.id,
      login: user.login,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth(SESSION_COOKIE_NAME)
  @ApiOperation({
    summary: 'Clear local session cookie',
  })
  @ApiNoContentResponse({ description: 'Logged out' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
    });
  }
}
