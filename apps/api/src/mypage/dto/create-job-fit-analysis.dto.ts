import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateJobFitAnalysisDto {
  @ApiProperty({ example: 'uuid-of-job' })
  @IsString()
  jobId!: string;

  @ApiProperty({ example: 'uuid-of-resume' })
  @IsString()
  resumeId!: string;
}
