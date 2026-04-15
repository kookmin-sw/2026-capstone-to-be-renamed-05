import { ApiProperty } from '@nestjs/swagger';

export class LabelDto {
  @ApiProperty({ example: 'bug' })
  name: string;

  @ApiProperty({ example: 'd73a4a' })
  color: string;

  @ApiProperty({
    example: 'Something is not working',
  })
  description: string;

  @ApiProperty({ example: 120 })
  usageCount: number;
}

export class LabelListResponseDto {
  @ApiProperty({ type: [LabelDto] })
  items: LabelDto[];

  @ApiProperty({ example: 3 })
  total: number;
}

export class LabelSettingsResponseDto {
  @ApiProperty({ example: true })
  autoLabelingEnabled: boolean;
}
