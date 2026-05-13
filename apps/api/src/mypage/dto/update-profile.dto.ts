import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '수습 CPA 김철수', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'c9d1ad4f-96f1-4c1b-86bb-5af4c59f64a8',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  profileImageAssetId?: string;

  @ApiPropertyOptional({
    description:
      'Legacy small data URL for a personal profile image, or null to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: 'profileImageUrl must be a PNG, JPG, or WEBP data URL.',
  })
  profileImageUrl?: string | null;
}
