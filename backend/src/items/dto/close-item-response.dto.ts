import { ApiProperty } from '@nestjs/swagger';

export class CloseItemResponseDto {
  @ApiProperty({ example: 101 })
  itemId: number;

  @ApiProperty({ example: 'CLOSED' })
  state: 'CLOSED';

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  closedAt: string;
}
