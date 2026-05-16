import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateJobFitAnalysisDto {
  @ApiProperty({ example: 'uuid-of-job' })
  @IsString()
  jobId!: string;

  @ApiProperty({ example: 'uuid-of-resume' })
  @IsString()
  resumeId!: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Set true to regenerate an existing analysis with OpenAI.',
  })
  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}
