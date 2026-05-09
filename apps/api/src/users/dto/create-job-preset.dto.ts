import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJobPresetDto {
  @ApiPropertyOptional({
    example: '서울 감사 신입',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @ApiProperty({
    example: {
      search: '감사',
      selectedLocations: ['서울 중구'],
      jobFamily: 'AUDIT',
    },
  })
  @IsObject()
  filter!: Record<string, unknown>;
}
