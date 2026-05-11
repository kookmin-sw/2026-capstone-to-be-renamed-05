import { ApiProperty } from '@nestjs/swagger';

export class SyncRepositoryResponseDto {
  @ApiProperty({ example: 1 })
  repositoryId: number;

  @ApiProperty({ example: 84 })
  totalFetched: number;

  @ApiProperty({ example: 50 })
  openCount: number;

  @ApiProperty({ example: 34 })
  closedCount: number;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  syncedAt: string;
}
