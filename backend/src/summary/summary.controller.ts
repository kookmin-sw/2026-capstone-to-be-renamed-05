import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PriorityLevel, WorkItemType } from '../dashboard/dto/dashboard-item.dto';
import { SummaryResponseDto } from './dto/summary-response.dto';

@ApiTags('Summary')
@ApiBearerAuth('bearer')
@Controller('summary')
export class SummaryController {
  @Get()
  @ApiOperation({
    summary: 'Get repository summary',
    description:
      'Returns dashboard summary statistics (priority counts, label counts, top 5 lists).',
  })
  @ApiOkResponse({
    description: 'Summary metrics.',
    type: SummaryResponseDto,
  })
  getSummary(
    @Query('repoId') repoId?: string,
    @Query('projectId') projectId?: string,
  ): SummaryResponseDto {
    void repoId;
    void projectId;
    return {
      priorityCounts: {
        HIGH: 10,
        MEDIUM: 24,
        LOW: 58,
      },
      labelCounts: [
        { label: 'bug', count: 21 },
        { label: 'feature', count: 17 },
        { label: 'release', count: 6 },
      ],
      topPriorityItems: [
        {
          id: 'repo-101-pr-88',
          taskType: WorkItemType.PULL_REQUEST,
          title: 'Fix critical cache invalidation bug',
          priority: PriorityLevel.HIGH,
        },
        {
          id: 'repo-101-issue-120',
          taskType: WorkItemType.ISSUE,
          title: 'Crash during large file import',
          priority: PriorityLevel.HIGH,
        },
      ],
      topLabels: [
        { label: 'bug', count: 21 },
        { label: 'feature', count: 17 },
        { label: 'release', count: 6 },
      ],
    };
  }
}
