import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  KicpaCondition,
  TraineeStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { JobPresetId } from '@cpa/shared';

const toOptionalBoolean = (value: unknown) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const toOptionalStringArray = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const careerLevels = ['entry', 'junior', 'experienced'] as const;
const jobPresetIds = [
  'active-hiring',
  'career-verified',
] as const satisfies readonly JobPresetId[];

const toOptionalCommaStringArray = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index);
};

export class ListJobsDto {
  @ApiPropertyOptional({ example: '감사' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: jobPresetIds })
  @IsOptional()
  @IsIn([...jobPresetIds])
  preset?: JobPresetId;

  @ApiPropertyOptional({ enum: JobFamily, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(JobFamily, { each: true })
  jobFamily?: JobFamily[];

  @ApiPropertyOptional({ enum: CompanyType, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(CompanyType, { each: true })
  companyType?: CompanyType[];

  @ApiPropertyOptional({ example: '서울' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: [String], example: ['서울', '대구 서구'] })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalStringArray(value))
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ enum: TraineeStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(TraineeStatus, { each: true })
  traineeStatus?: TraineeStatus[];

  @ApiPropertyOptional({ enum: EmploymentType, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(EmploymentType, { each: true })
  employmentType?: EmploymentType[];

  @ApiPropertyOptional({ enum: KicpaCondition, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(KicpaCondition, { each: true })
  kicpaCondition?: KicpaCondition[];

  @ApiPropertyOptional({ enum: DeadlineType, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsEnum(DeadlineType, { each: true })
  deadlineType?: DeadlineType[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalBoolean(value))
  @IsBoolean()
  practicalTrainingInstitution?: boolean;

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  deadlineWithinDays?: number;

  @ApiPropertyOptional({
    enum: careerLevels,
    isArray: true,
    example: ['junior', 'experienced'],
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    toOptionalCommaStringArray(value),
  )
  @IsIn(careerLevels, { each: true })
  careerLevel?: Array<(typeof careerLevels)[number]>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  minExperienceYears?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  maxExperienceYears?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minCompanyAgeYears?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxCompanyAgeYears?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxAttritionRate?: number;

  @ApiPropertyOptional({
    enum: ['deadlineAsc', 'latest', 'experienceAsc', 'companyType', 'expired'],
    default: 'deadlineAsc',
  })
  @IsOptional()
  @IsIn(['deadlineAsc', 'latest', 'experienceAsc', 'companyType', 'expired'])
  sort?: 'deadlineAsc' | 'latest' | 'experienceAsc' | 'companyType' | 'expired';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
