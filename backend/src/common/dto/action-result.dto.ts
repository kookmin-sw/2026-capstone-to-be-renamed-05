import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Action completed successfully' })
  message: string;

  @ApiPropertyOptional({ example: ['item_1', 'item_2'], type: [String] })
  affectedIds?: string[];
}
