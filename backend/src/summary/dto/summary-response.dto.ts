import { ApiProperty } from '@nestjs/swagger';
import { PriorityLevel, WorkItemType } from '../../dashboard/dto/dashboard-item.dto';

export class PriorityCountsDto {
  @ApiProperty({ example: 10 })
  [PriorityLevel.HIGH]: number;

  @ApiProperty({ example: 24 })
  [PriorityLevel.MEDIUM]: number;

  @ApiProperty({ example: 58 })
  [PriorityLevel.LOW]: number;
}

export class LabelCountDto {
  @ApiProperty({ example: 'bug' })
  label: string;

  @ApiProperty({ example: 21 })
  count: number;
}

export class TopWorkItemDto {
  @ApiProperty({ example: 'repo-101-pr-88' })
  id: string;

  @ApiProperty({ enum: WorkItemType, example: WorkItemType.PULL_REQUEST })
  taskType: WorkItemType;

  @ApiProperty({ example: 'Fix critical cache invalidation bug' })
  title: string;

  @ApiProperty({ enum: PriorityLevel, example: PriorityLevel.HIGH })
  priority: PriorityLevel;
}

export class SummaryResponseDto {
  @ApiProperty({ type: PriorityCountsDto })
  priorityCounts: PriorityCountsDto;

  @ApiProperty({ type: [LabelCountDto] })
  labelCounts: LabelCountDto[];

  @ApiProperty({
    type: [TopWorkItemDto],
    description: 'Top 5 high-priority items.',
  })
  topPriorityItems: TopWorkItemDto[];

  @ApiProperty({
    type: [LabelCountDto],
    description: 'Top 5 labels by item count.',
  })
  topLabels: LabelCountDto[];
}
