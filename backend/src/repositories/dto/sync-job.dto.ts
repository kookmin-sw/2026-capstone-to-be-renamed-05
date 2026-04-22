import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncJobDto {
  @ApiProperty({ example: 12 })
  jobId: number;

  @ApiProperty({ example: 2 })
  repositoryId: number;

  @ApiProperty({ example: 'RUNNING' })
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

  @ApiPropertyOptional({ example: 80 })
  progressPercent?: number;

  @ApiPropertyOptional({ example: 120 })
  totalPages?: number;

  @ApiProperty({ example: 96 })
  processedPages: number;

  @ApiProperty({ example: 9600 })
  totalFetched: number;

  @ApiProperty({ example: 5400 })
  openCount: number;

  @ApiProperty({ example: 4200 })
  closedCount: number;

  @ApiPropertyOptional({ example: 'Rate limit exceeded' })
  errorMessage?: string;

  @ApiPropertyOptional({ example: '2026-04-19T08:10:00.000Z' })
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-04-19T08:12:00.000Z' })
  finishedAt?: string;

  @ApiProperty({ example: '2026-04-19T08:10:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-19T08:11:30.000Z' })
  updatedAt: string;
}
