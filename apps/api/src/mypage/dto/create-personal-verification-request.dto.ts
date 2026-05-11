import { ApiProperty } from '@nestjs/swagger';
import { PersonalCareerStage } from '@prisma/client';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePersonalVerificationRequestDto {
  @ApiProperty({ example: 'Kim CPA', maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  applicantName!: string;

  @ApiProperty({ example: '1998-03-14' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate!: string;

  @ApiProperty({ example: '12345', maxLength: 40 })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  registrationNumber!: string;

  @ApiProperty({ enum: PersonalCareerStage, example: 'CPA_UNPLACED' })
  @IsEnum(PersonalCareerStage)
  requestedCareerStage!: PersonalCareerStage;
}
