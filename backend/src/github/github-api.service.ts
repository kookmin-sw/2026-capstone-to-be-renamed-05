import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type GitHubRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  owner: {
    login: string;
  };
  default_branch: string;
};

export type GitHubIssue = {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user?: {
    login: string;
  };
  labels?: Array<{ name?: string }>;
  created_at: string;
  updated_at: string;
  pull_request?: {
    url: string;
  };
};

export type GitHubIssuePagePayload = {
  issues: GitHubIssue[];
  page: number;
  totalPages: number | null;
};

@Injectable()
export class GitHubApiService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly apiVersion = '2022-11-28';

  private async requestJson<T>(
    url: string,
    token: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': this.apiVersion,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new HttpException(
        {
          statusCode: response.status,
          errorCode: 'GITHUB_API_ERROR',
          message: `GitHub API request failed: ${response.status} ${text}`,
        },
        response.status,
      );
    }

    return (await response.json()) as T;
  }

  private parseNextLink(headerValue: string | null): string | null {
    if (!headerValue) return null;
    const parts = headerValue.split(',');
    for (const part of parts) {
      const section = part.trim();
      const match = section.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (!match) continue;
      if (match[2] === 'next') return match[1];
    }
    return null;
  }

  private parseLastPage(headerValue: string | null): number | null {
    if (!headerValue) return 1;
    const parts = headerValue.split(',');
    for (const part of parts) {
      const section = part.trim();
      const match = section.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (!match) continue;
      if (match[2] !== 'last') continue;
      try {
        const parsed = new URL(match[1]);
        const pageParam = parsed.searchParams.get('page');
        const page = Number(pageParam);
        if (!Number.isNaN(page) && page > 0) {
          return page;
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  private async requestPaginated<T>(path: string, token: string): Promise<T[]> {
    const merged: T[] = [];
    let nextUrl: string | null = `${this.baseUrl}${path}`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': this.apiVersion,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new HttpException(
          {
            statusCode: response.status,
            errorCode: 'GITHUB_API_ERROR',
            message: `GitHub API request failed: ${response.status} ${text}`,
          },
          response.status,
        );
      }

      const page = (await response.json()) as T[];
      merged.push(...page);
      nextUrl = this.parseNextLink(response.headers.get('link'));
    }

    return merged;
  }

  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type?: string;
    scope?: string;
  }> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: 'GITHUB_OAUTH_CONFIG_MISSING',
        message: 'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured',
      });
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: 'GITHUB_OAUTH_TOKEN_EXCHANGE_FAILED',
        message: `Failed to exchange OAuth code: ${text}`,
      });
    }

    const payload = (await response.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!payload.access_token) {
      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        errorCode: 'GITHUB_OAUTH_TOKEN_MISSING',
        message:
          payload.error_description || payload.error || 'OAuth token missing in response',
      });
    }

    return {
      access_token: payload.access_token,
      token_type: payload.token_type,
      scope: payload.scope,
    };
  }

  async getAuthenticatedUser(token: string): Promise<GitHubUser> {
    return this.requestJson<GitHubUser>(`${this.baseUrl}/user`, token);
  }

  async listUserRepos(token: string): Promise<GitHubRepo[]> {
    return this.requestPaginated<GitHubRepo>('/user/repos?per_page=100&sort=updated', token);
  }

  async getRepoByFullName(token: string, fullName: string): Promise<GitHubRepo> {
    return this.requestJson<GitHubRepo>(`${this.baseUrl}/repos/${fullName}`, token);
  }

  async listRepoIssuesAndPulls(
    token: string,
    owner: string,
    repo: string,
  ): Promise<GitHubIssue[]> {
    return this.requestPaginated<GitHubIssue>(
      `/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      token,
    );
  }

  async iterateRepoIssuesAndPulls(
    token: string,
    owner: string,
    repo: string,
    onPage: (payload: GitHubIssuePagePayload) => Promise<void> | void,
  ): Promise<void> {
    let nextUrl: string | null = `${this.baseUrl}/repos/${owner}/${repo}/issues?state=all&per_page=100`;
    let currentPage = 0;
    let totalPages: number | null = null;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': this.apiVersion,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new HttpException(
          {
            statusCode: response.status,
            errorCode: 'GITHUB_API_ERROR',
            message: `GitHub API request failed: ${response.status} ${text}`,
          },
          response.status,
        );
      }

      currentPage += 1;
      const linkHeader = response.headers.get('link');
      if (totalPages === null) {
        totalPages = this.parseLastPage(linkHeader);
      }

      const issues = (await response.json()) as GitHubIssue[];
      await onPage({
        issues,
        page: currentPage,
        totalPages,
      });

      nextUrl = this.parseNextLink(linkHeader);
      if (!nextUrl && totalPages === null) {
        totalPages = currentPage;
      }
    }
  }

  async closeIssueOrPull(
    token: string,
    owner: string,
    repo: string,
    number: number,
  ): Promise<void> {
    await this.requestJson<unknown>(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${number}`,
      token,
      {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
      },
    );
  }
}
