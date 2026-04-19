import { Controller, Get } from '@nestjs/common';
import {
  ApiProperty,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { SESSION_COOKIE_NAME } from '../common/auth/session.constants';
import { AuthService } from '../auth/auth.service';
import { GitHubApiService } from './github-api.service';

class GitHubRepoDto {
  @ApiProperty({ example: 321 })
  id: number;
  @ApiProperty({ example: 'swiftlang/swift' })
  fullName: string;
  @ApiProperty({ example: 'swiftlang' })
  owner: string;
  @ApiProperty({ example: 'swift' })
  name: string;
  @ApiProperty({ example: false })
  isPrivate: boolean;
  @ApiProperty({ example: 'main' })
  defaultBranch: string;
}

class GitHubRepoListResponseDto {
  @ApiProperty({ type: [GitHubRepoDto] })
  items: GitHubRepoDto[];
  @ApiProperty({ example: 10 })
  total: number;
}

@ApiTags('GitHub')
@Controller('github')
export class GitHubReposController {
  constructor(
    private readonly authService: AuthService,
    private readonly githubApi: GitHubApiService,
  ) {}

  @Get('repos')
  @ApiCookieAuth(SESSION_COOKIE_NAME)
  @ApiOperation({
    summary: 'List accessible repositories from authenticated GitHub user',
  })
  @ApiOkResponse({ type: GitHubRepoListResponseDto })
  async listGitHubRepos(
    @CurrentUserId() userId: number,
  ): Promise<GitHubRepoListResponseDto> {
    const token = await this.authService.getGitHubTokenOrThrow(userId);
    const repos = await this.githubApi.listUserRepos(token);

    const items = repos.map((repo) => ({
      id: repo.id,
      fullName: repo.full_name,
      owner: repo.owner.login,
      name: repo.name,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
    }));

    return {
      items,
      total: items.length,
    };
  }
}
