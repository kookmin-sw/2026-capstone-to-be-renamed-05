import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateCompanyBackgroundDto {
  @ApiProperty({ example: 'c9d1ad4f-96f1-4c1b-86bb-5af4c59f64a8' })
  @IsString()
  @MaxLength(80)
  backgroundAssetId!: string;
}
