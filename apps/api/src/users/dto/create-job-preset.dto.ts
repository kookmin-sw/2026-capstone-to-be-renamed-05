import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class CreateJobPresetDto {
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
