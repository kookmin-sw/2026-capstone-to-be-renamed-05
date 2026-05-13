import { JobEngagementEventType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateJobEngagementDto {
  @IsEnum(JobEngagementEventType)
  type!: JobEngagementEventType;
}
