import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Standard Library' })
  name: string;

  @ApiProperty({
    example:
      'Focus area for standard library related issue triage and pull request reviews.',
  })
  description: string;

  @ApiProperty({
    type: [String],
    example: ['stdlib', 'foundation'],
  })
  keywords: string[];

  @ApiProperty({ example: '2026-04-14T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-15T08:00:00.000Z' })
  updatedAt: string;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectDto] })
  items: ProjectDto[];

  @ApiProperty({ example: 1 })
  total: number;
}
