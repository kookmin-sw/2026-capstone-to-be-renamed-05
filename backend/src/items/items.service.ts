import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { WORK_ITEM_STATES } from '../common/domain.constants';
import { GitHubApiService } from '../github/github-api.service';
import { PrismaService } from '../prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repositoriesService: RepositoriesService,
    private readonly authService: AuthService,
    private readonly githubApi: GitHubApiService,
  ) {}

  async closeItem(userId: number, itemId: number) {
    const item = await this.repositoriesService.getOwnedWorkItemOrThrow(userId, itemId);
    const token = await this.authService.getGitHubTokenOrThrow(userId);

    await this.githubApi.closeIssueOrPull(
      token,
      item.repository.owner,
      item.repository.name,
      item.number,
    );

    const closedAt = new Date();
    await this.prisma.workItem.update({
      where: { id: item.id },
      data: {
        state: WORK_ITEM_STATES[1],
        updatedAtOnGitHub: closedAt,
      },
    });

    return {
      itemId: item.id,
      state: 'CLOSED' as const,
      closedAt,
    };
  }
}
