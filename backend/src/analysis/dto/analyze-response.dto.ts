import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeRepositoryResponseDto {
  @ApiProperty({ example: 1 })
  repositoryId: number;

  @ApiProperty({ example: 84 })
  analyzedItems: number;

  @ApiProperty({ example: 6 })
  duplicateGroups: number;

  @ApiProperty({ example: true })
  llmUsed: boolean;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  analyzedAt: string;
}
