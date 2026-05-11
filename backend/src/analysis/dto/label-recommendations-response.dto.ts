import { ApiProperty } from '@nestjs/swagger';

class LabelRecommendationDto {
  @ApiProperty({ example: 'bug' })
  label: string;

  @ApiProperty({ example: 'Crash-related keywords were detected.' })
  reason: string;

  @ApiProperty({ example: 0.88 })
  score: number;
}

class LabelRecommendationItemDto {
  @ApiProperty({ example: 102 })
  itemId: number;

  @ApiProperty({ example: 'Fix crash when parsing source file' })
  title: string;

  @ApiProperty({ type: [LabelRecommendationDto] })
  recommendations: LabelRecommendationDto[];
}

export class LabelRecommendationsResponseDto {
  @ApiProperty({ type: [LabelRecommendationItemDto] })
  items: LabelRecommendationItemDto[];

  @ApiProperty({ example: 84 })
  total: number;
}
