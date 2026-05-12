import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '수습 CPA 김철수', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    description:
      'Small data URL for a personal profile image, or null to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/, {
    message: 'profileImageUrl must be a PNG, JPG, WEBP, or GIF data URL.',
  })
  profileImageUrl?: string | null;
}
