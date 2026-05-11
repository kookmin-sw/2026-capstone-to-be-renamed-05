import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SyncJob } from '@prisma/client';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { SESSION_COOKIE_NAME } from '../common/auth/session.constants';
import { ConnectRepositoryRequestDto } from './dto/connect-repo-request.dto';
import {
  ConnectedRepositoryDto,
  ConnectedRepositoryListResponseDto,
} from './dto/connected-repo.dto';
import {
  WORK_ITEM_STATES,
  WORK_ITEM_TYPES,
  WorkItemStateValue,
  WorkItemTypeValue,
} from '../common/domain.constants';
import {
  RepositoryItemListResponseDto,
  RepositoryItemsQueryDto,
} from './dto/repository-item.dto';
import { SyncJobDto } from './dto/sync-job.dto';
import { SyncRepositoryResponseDto } from './dto/sync-response.dto';
import { RepositoriesService } from './repositories.service';

@ApiTags('Repositories')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('repos')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List connected repositories' })
  @ApiOkResponse({ type: ConnectedRepositoryListResponseDto })
  async listConnectedRepositories(
    @CurrentUserId() userId: number,
  ): Promise<ConnectedRepositoryListResponseDto> {
    const repos = await this.repositoriesService.listConnectedRepositories(userId);
    return {
      items: repos.map((repo) => this.toConnectedRepoDto(repo)),
      total: repos.length,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Connect repository by owner/repo' })
  @ApiCreatedResponse({ type: ConnectedRepositoryDto })
  async connectRepository(
    @CurrentUserId() userId: number,
    @Body() request: ConnectRepositoryRequestDto,
  ): Promise<ConnectedRepositoryDto> {
    const repo = await this.repositoriesService.connectRepository(userId, request.fullName);
    return this.toConnectedRepoDto(repo);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect repository' })
  @ApiNoContentResponse({ description: 'Disconnected' })
  async disconnectRepository(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.repositoriesService.deleteConnectedRepository(userId, id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Run one-shot sync for issues and pull requests' })
  @ApiOkResponse({ type: SyncRepositoryResponseDto })
  async syncRepository(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SyncRepositoryResponseDto> {
    const result = await this.repositoriesService.syncRepository(userId, id);
    return {
      repositoryId: result.repositoryId,
      totalFetched: result.totalFetched,
      openCount: result.openCount,
      closedCount: result.closedCount,
      syncedAt: result.syncedAt.toISOString(),
    };
  }

  @Post(':id/sync-jobs')
  @ApiOperation({ summary: 'Start asynchronous sync job for repository' })
  @ApiCreatedResponse({ type: SyncJobDto })
  async startSyncJob(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SyncJobDto> {
    const job = await this.repositoriesService.createSyncJob(userId, id);
    return this.toSyncJobDto(job);
  }

  @Get(':id/sync-jobs/latest')
  @ApiOperation({ summary: 'Get latest sync job status for repository' })
  @ApiOkResponse({ type: SyncJobDto })
  async getLatestSyncJob(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SyncJobDto> {
    const job = await this.repositoriesService.getLatestSyncJob(userId, id);
    return this.toSyncJobDto(job);
  }

  @Get(':id/sync-jobs/:jobId')
  @ApiOperation({ summary: 'Get sync job status by job id' })
  @ApiOkResponse({ type: SyncJobDto })
  async getSyncJob(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('jobId', ParseIntPipe) jobId: number,
  ): Promise<SyncJobDto> {
    const job = await this.repositoriesService.getSyncJob(userId, id, jobId);
    return this.toSyncJobDto(job);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'List synced issues/pr for repository' })
  @ApiOkResponse({ type: RepositoryItemListResponseDto })
  async listRepositoryItems(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RepositoryItemsQueryDto,
  ): Promise<RepositoryItemListResponseDto> {
    const result = await this.repositoriesService.listRepositoryItems(userId, id, query);

    return {
      items: result.items.map((item) => ({
        id: item.id,
        number: item.number,
        type: this.normalizeType(item.type),
        state: this.normalizeState(item.state),
        title: item.title,
        url: item.url,
        labels: this.parseLabels(item.labels),
        updatedAtOnGitHub: item.updatedAtOnGitHub?.toISOString() ?? item.updatedAt.toISOString(),
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  private parseLabels(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((label) => String(label));
      }
      return [];
    } catch {
      return [];
    }
  }

  private normalizeType(raw: string): WorkItemTypeValue {
    if (WORK_ITEM_TYPES.includes(raw as WorkItemTypeValue)) {
      return raw as WorkItemTypeValue;
    }
    return WORK_ITEM_TYPES[0];
  }

  private normalizeState(raw: string): WorkItemStateValue {
    if (WORK_ITEM_STATES.includes(raw as WorkItemStateValue)) {
      return raw as WorkItemStateValue;
    }
    return WORK_ITEM_STATES[0];
  }

  private toConnectedRepoDto(repo: {
    id: number;
    fullName: string;
    owner: string;
    name: string;
    isPrivate: boolean;
    defaultBranch: string | null;
    lastSyncedAt: Date | null;
  }): ConnectedRepositoryDto {
    return {
      id: repo.id,
      fullName: repo.fullName,
      owner: repo.owner,
      name: repo.name,
      isPrivate: repo.isPrivate,
      defaultBranch: repo.defaultBranch ?? undefined,
      lastSyncedAt: repo.lastSyncedAt?.toISOString(),
    };
  }

  private toSyncJobDto(job: SyncJob): SyncJobDto {
    const progressPercent =
      job.status === 'SUCCEEDED'
        ? 100
        : job.totalPages && job.totalPages > 0
          ? Math.min(99, Math.round((job.processedPages / job.totalPages) * 100))
          : undefined;

    return {
      jobId: job.id,
      repositoryId: job.repositoryId,
      status: job.status as SyncJobDto['status'],
      progressPercent,
      totalPages: job.totalPages ?? undefined,
      processedPages: job.processedPages,
      totalFetched: job.totalFetched,
      openCount: job.openCount,
      closedCount: job.closedCount,
      errorMessage: job.errorMessage ?? undefined,
      startedAt: job.startedAt?.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
