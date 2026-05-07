import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateCompanyLogoDto {
  @ApiProperty({ example: '/uploads/company-logos/example.png' })
  @IsString()
  @MaxLength(500)
  logoUrl!: string;
}
