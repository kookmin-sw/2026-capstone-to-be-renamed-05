import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  PROFILE_IMAGE_ALLOWED_CONTENT_TYPES,
  PROFILE_IMAGE_MAX_BYTES,
} from '../logo-asset.constants';

export class CreateProfileImageUploadUrlDto {
  @ApiProperty({ example: 'profile.png' })
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({
    enum: PROFILE_IMAGE_ALLOWED_CONTENT_TYPES,
    example: 'image/png',
  })
  @IsString()
  @IsIn(PROFILE_IMAGE_ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @ApiProperty({ example: 234567, maximum: PROFILE_IMAGE_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(PROFILE_IMAGE_MAX_BYTES)
  byteSize!: number;
}
