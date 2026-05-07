import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType, UserRole } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'test002' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.JOB_SEEKER })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: '수습 CPA' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: '한빛회계법인' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @ApiPropertyOptional({
    enum: CompanyType,
    example: CompanyType.LOCAL_ACCOUNTING_FIRM,
  })
  @IsOptional()
  @IsEnum(CompanyType)
  companyType?: CompanyType;

  @ApiPropertyOptional({ example: '/company-logos/hanbit-accounting.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;
}
