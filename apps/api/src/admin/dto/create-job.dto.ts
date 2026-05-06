import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  JobStatus,
  KicpaCondition,
  TraineeStatus,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  companyId!: string;

  @ApiProperty()
  @IsString()
  sourceId!: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  originalUrl!: string;

  @ApiProperty({ enum: JobFamily })
  @IsEnum(JobFamily)
  jobFamily!: JobFamily;

  @ApiProperty({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @ApiProperty({ enum: CompanyType })
  @IsEnum(CompanyType)
  companyType!: CompanyType;

  @ApiProperty({ enum: KicpaCondition })
  @IsEnum(KicpaCondition)
  kicpaCondition!: KicpaCondition;

  @ApiProperty({ enum: TraineeStatus })
  @IsEnum(TraineeStatus)
  traineeStatus!: TraineeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  practicalTrainingInstitution?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxExperienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ enum: DeadlineType })
  @IsEnum(DeadlineType)
  deadlineType!: DeadlineType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
