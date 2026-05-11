import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  COMPANY_BACKGROUND_ALLOWED_CONTENT_TYPES,
  COMPANY_BACKGROUND_MAX_BYTES,
} from '../logo-asset.constants';

export class CreateCompanyBackgroundUploadUrlDto {
  @ApiProperty({ example: 'background.jpg' })
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({
    enum: COMPANY_BACKGROUND_ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(COMPANY_BACKGROUND_ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @ApiProperty({ example: 1456789, maximum: COMPANY_BACKGROUND_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(COMPANY_BACKGROUND_MAX_BYTES)
  byteSize!: number;
}
