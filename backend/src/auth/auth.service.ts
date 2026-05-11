import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PROVIDER_GITHUB } from '../common/domain.constants';
import { GitHubApiService } from '../github/github-api.service';
import { PrismaService } from '../prisma.service';
import { OAUTH_STATE_TTL_MS } from '../common/auth/session.constants';

@Injectable()
export class AuthService {
  private readonly stateStore = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubApi: GitHubApiService,
  ) {}

  buildGitHubLoginUrl(): { state: string; redirectUrl: string } {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'GITHUB_OAUTH_CONFIG_MISSING',
        message: 'GITHUB_CLIENT_ID is required',
      });
    }

    const state = randomBytes(24).toString('base64url');
    this.stateStore.set(state, Date.now() + OAUTH_STATE_TTL_MS);

    const scope = process.env.GITHUB_OAUTH_SCOPES ?? 'repo,read:user,user:email';
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    const params = new URLSearchParams({
      client_id: clientId,
      scope,
      state,
    });

    if (redirectUri) {
      params.set('redirect_uri', redirectUri);
    }

    return {
      state,
      redirectUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  private consumeStateOrThrow(state: string): void {
    const expiresAt = this.stateStore.get(state);
    this.stateStore.delete(state);

    if (!expiresAt || expiresAt < Date.now()) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'INVALID_OAUTH_STATE',
        message: 'OAuth state is invalid or expired',
      });
    }
  }

  async handleGitHubCallback(code: string, state: string) {
    if (!code || !state) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'OAUTH_CALLBACK_INVALID',
        message: 'Both code and state are required',
      });
    }

    this.consumeStateOrThrow(state);

    const tokenPayload = await this.githubApi.exchangeCodeForToken(code);
    const githubUser = await this.githubApi.getAuthenticatedUser(tokenPayload.access_token);

    const user = await this.prisma.user.upsert({
      where: {
        githubId: String(githubUser.id),
      },
      update: {
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
      },
      create: {
        githubId: String(githubUser.id),
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
      },
    });

    await this.prisma.oAuthAccount.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: PROVIDER_GITHUB,
        },
      },
      update: {
        accessToken: tokenPayload.access_token,
        tokenType: tokenPayload.token_type,
        scope: tokenPayload.scope,
      },
      create: {
        userId: user.id,
        provider: PROVIDER_GITHUB,
        accessToken: tokenPayload.access_token,
        tokenType: tokenPayload.token_type,
        scope: tokenPayload.scope,
      },
    });

    return user;
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User session is invalid');
    }
    return user;
  }

  async getGitHubTokenOrThrow(userId: number): Promise<string> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: PROVIDER_GITHUB,
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'GITHUB_ACCOUNT_NOT_CONNECTED',
        message: 'GitHub account is not connected. Login again.',
      });
    }

    return account.accessToken;
  }
}
