import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectedRepository, Prisma, SyncJob } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { WORK_ITEM_STATES, WORK_ITEM_TYPES } from '../common/domain.constants';
import { GitHubApiService } from '../github/github-api.service';
import { PrismaService } from '../prisma.service';
import { RepositoryItemsQueryDto } from './dto/repository-item.dto';

const SYNC_JOB_STATUSES = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

type SyncProgressSnapshot = {
  totalPages: number | null;
  processedPages: number;
  totalFetched: number;
  openCount: number;
  closedCount: number;
};

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly githubApi: GitHubApiService,
  ) {}

  async listConnectedRepositories(userId: number) {
    return this.prisma.connectedRepository.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async connectRepository(userId: number, fullName: string) {
    const token = await this.authService.getGitHubTokenOrThrow(userId);
    const repo = await this.githubApi.getRepoByFullName(token, fullName);

    return this.prisma.connectedRepository.upsert({
      where: {
        userId_fullName: {
          userId,
          fullName: repo.full_name,
        },
      },
      update: {
        githubRepoId: String(repo.id),
        owner: repo.owner.login,
        name: repo.name,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
      },
      create: {
        userId,
        githubRepoId: String(repo.id),
        fullName: repo.full_name,
        owner: repo.owner.login,
        name: repo.name,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
      },
    });
  }

  async deleteConnectedRepository(userId: number, repositoryId: number) {
    const repo = await this.prisma.connectedRepository.findUnique({
      where: { id: repositoryId },
    });

    if (!repo) {
      throw new NotFoundException('Connected repository not found');
    }

    if (repo.userId !== userId) {
      throw new ForbiddenException('Cannot delete repository of another user');
    }

    await this.prisma.connectedRepository.delete({ where: { id: repositoryId } });
  }

  async getOwnedRepositoryOrThrow(
    userId: number,
    repositoryId: number,
  ): Promise<ConnectedRepository> {
    const repository = await this.prisma.connectedRepository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new NotFoundException('Connected repository not found');
    }

    if (repository.userId !== userId) {
      throw new ForbiddenException('Cannot access repository of another user');
    }

    return repository;
  }

  private async upsertWorkItem(
    repositoryId: number,
    entry: {
      id: number;
      node_id: string;
      number: number;
      title: string;
      body: string | null;
      state: 'open' | 'closed';
      html_url: string;
      user?: { login: string };
      labels?: Array<{ name?: string }>;
      created_at: string;
      updated_at: string;
      pull_request?: { url: string };
    },
  ): Promise<{ state: string }> {
    const type = entry.pull_request ? WORK_ITEM_TYPES[1] : WORK_ITEM_TYPES[0];
    const state = entry.state === 'closed' ? WORK_ITEM_STATES[1] : WORK_ITEM_STATES[0];

    const labels = (entry.labels ?? [])
      .map((label) => label.name)
      .filter((name): name is string => Boolean(name));

    await this.prisma.workItem.upsert({
      where: {
        repositoryId_type_number: {
          repositoryId,
          type,
          number: entry.number,
        },
      },
      update: {
        githubIssueId: String(entry.id),
        githubNodeId: entry.node_id,
        title: entry.title,
        body: entry.body ?? '',
        state,
        url: entry.html_url,
        labels: JSON.stringify(labels),
        authorLogin: entry.user?.login,
        createdAtOnGitHub: new Date(entry.created_at),
        updatedAtOnGitHub: new Date(entry.updated_at),
        lastSyncedAt: new Date(),
      },
      create: {
        repositoryId,
        githubIssueId: String(entry.id),
        githubNodeId: entry.node_id,
        number: entry.number,
        type,
        title: entry.title,
        body: entry.body ?? '',
        state,
        url: entry.html_url,
        labels: JSON.stringify(labels),
        authorLogin: entry.user?.login,
        createdAtOnGitHub: new Date(entry.created_at),
        updatedAtOnGitHub: new Date(entry.updated_at),
        lastSyncedAt: new Date(),
      },
    });

    return { state };
  }

  private async syncRepositoryEntries(
    userId: number,
    repository: ConnectedRepository,
    onProgress?: (progress: SyncProgressSnapshot) => Promise<void> | void,
  ) {
    const token = await this.authService.getGitHubTokenOrThrow(userId);

    const progress: SyncProgressSnapshot = {
      totalPages: null,
      processedPages: 0,
      totalFetched: 0,
      openCount: 0,
      closedCount: 0,
    };

    await this.githubApi.iterateRepoIssuesAndPulls(
      token,
      repository.owner,
      repository.name,
      async (payload) => {
        progress.processedPages = payload.page;
        progress.totalPages = payload.totalPages;

        for (const entry of payload.issues) {
          const result = await this.upsertWorkItem(repository.id, entry);
          progress.totalFetched += 1;
          if (result.state === WORK_ITEM_STATES[0]) {
            progress.openCount += 1;
          } else {
            progress.closedCount += 1;
          }
        }

        if (onProgress) {
          await onProgress({ ...progress });
        }
      },
    );

    const syncedAt = new Date();
    await this.prisma.connectedRepository.update({
      where: { id: repository.id },
      data: { lastSyncedAt: syncedAt },
    });

    return {
      repositoryId: repository.id,
      syncedAt,
      ...progress,
    };
  }

  async syncRepository(userId: number, repositoryId: number) {
    const repository = await this.getOwnedRepositoryOrThrow(userId, repositoryId);
    const result = await this.syncRepositoryEntries(userId, repository);

    return {
      repositoryId: result.repositoryId,
      totalFetched: result.totalFetched,
      openCount: result.openCount,
      closedCount: result.closedCount,
      syncedAt: result.syncedAt,
    };
  }

  async createSyncJob(userId: number, repositoryId: number) {
    const repository = await this.getOwnedRepositoryOrThrow(userId, repositoryId);

    const job = await this.prisma.syncJob.create({
      data: {
        userId,
        repositoryId: repository.id,
        status: SYNC_JOB_STATUSES.QUEUED,
      },
    });

    void this.runSyncJob(job.id, userId, repository);
    return job;
  }

  async getSyncJob(userId: number, repositoryId: number, jobId: number): Promise<SyncJob> {
    await this.getOwnedRepositoryOrThrow(userId, repositoryId);

    const job = await this.prisma.syncJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.repositoryId !== repositoryId || job.userId !== userId) {
      throw new NotFoundException('Sync job not found');
    }

    return job;
  }

  async getLatestSyncJob(userId: number, repositoryId: number): Promise<SyncJob> {
    await this.getOwnedRepositoryOrThrow(userId, repositoryId);

    const job = await this.prisma.syncJob.findFirst({
      where: {
        userId,
        repositoryId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!job) {
      throw new NotFoundException('Sync job not found');
    }

    return job;
  }

  private async runSyncJob(
    jobId: number,
    userId: number,
    repository: ConnectedRepository,
  ): Promise<void> {
    const startedAt = new Date();
    await this.prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: SYNC_JOB_STATUSES.RUNNING,
        startedAt,
        finishedAt: null,
        errorMessage: null,
        totalPages: null,
        processedPages: 0,
        totalFetched: 0,
        openCount: 0,
        closedCount: 0,
      },
    });

    try {
      const result = await this.syncRepositoryEntries(userId, repository, async (progress) => {
        await this.prisma.syncJob.update({
          where: { id: jobId },
          data: {
            status: SYNC_JOB_STATUSES.RUNNING,
            totalPages: progress.totalPages,
            processedPages: progress.processedPages,
            totalFetched: progress.totalFetched,
            openCount: progress.openCount,
            closedCount: progress.closedCount,
          },
        });
      });

      await this.prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: SYNC_JOB_STATUSES.SUCCEEDED,
          totalPages: result.totalPages,
          processedPages: result.processedPages,
          totalFetched: result.totalFetched,
          openCount: result.openCount,
          closedCount: result.closedCount,
          finishedAt: result.syncedAt,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error while sync job running';
      await this.prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: SYNC_JOB_STATUSES.FAILED,
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
    }
  }

  async listRepositoryItems(
    userId: number,
    repositoryId: number,
    query: RepositoryItemsQueryDto,
  ) {
    await this.getOwnedRepositoryOrThrow(userId, repositoryId);

    const where: Prisma.WorkItemWhereInput = { repositoryId };
    if (query.type) where.type = query.type;
    if (query.state) where.state = query.state;

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.workItem.findMany({
        where,
        orderBy: [{ updatedAtOnGitHub: 'desc' }, { number: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.workItem.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async getOwnedWorkItemOrThrow(userId: number, itemId: number) {
    const item = await this.prisma.workItem.findUnique({
      where: { id: itemId },
      include: { repository: true },
    });

    if (!item) {
      throw new NotFoundException('Work item not found');
    }

    if (item.repository.userId !== userId) {
      throw new ForbiddenException('Cannot access item of another user');
    }

    return item;
  }
}
