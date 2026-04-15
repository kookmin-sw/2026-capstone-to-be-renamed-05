import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLabelSettingsRequestDto {
  @ApiProperty({
    example: true,
    description: 'Enable or disable auto-labeling.',
  })
  @IsBoolean()
  autoLabelingEnabled: boolean;
}

export class SyncLabelsRequestDto {
  @ApiProperty({
    example: 101,
    description: 'Repository ID to sync labels from provider.',
  })
  @IsInt()
  @Min(1)
  repoId: number;

  @ApiPropertyOptional({
    example: 'manual_sync',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  triggeredBy?: string;
}
