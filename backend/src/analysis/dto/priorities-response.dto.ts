import { ApiProperty } from '@nestjs/swagger';

class PriorityItemDto {
  @ApiProperty({ example: 102 })
  itemId: number;

  @ApiProperty({ example: 88428 })
  number: number;

  @ApiProperty({ example: 'PULL_REQUEST' })
  type: string;

  @ApiProperty({ example: 'HIGH' })
  priority: string;

  @ApiProperty({ example: 'Reviewer assignment and crash-related keywords found.' })
  reason: string;

  @ApiProperty({ example: 'Fix crash when parsing source file' })
  title: string;
}

export class PrioritiesResponseDto {
  @ApiProperty({ type: [PriorityItemDto] })
  items: PriorityItemDto[];

  @ApiProperty({ example: 84 })
  total: number;
}
