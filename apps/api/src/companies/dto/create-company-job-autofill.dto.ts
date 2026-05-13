import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyJobAutofillDto {
  @ApiProperty({
    example:
      '감사본부 수습 CPA 채용\n업무: 회계감사 보조\n접수마감: 2026-05-31',
    minLength: 40,
    maxLength: 12_000,
  })
  @IsString()
  @MinLength(40)
  @MaxLength(12_000)
  sourceText!: string;

  @ApiPropertyOptional({ example: 'https://example.com/careers/audit' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  originalUrl?: string;
}
