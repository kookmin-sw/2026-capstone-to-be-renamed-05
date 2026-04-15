import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectRequestDto {
  @ApiProperty({ example: 'Standard Library' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example:
      'Used by classifier to decide project relevance for incoming issues and pull requests.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['stdlib', 'abi'],
  })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  keywords?: string[];
}

export class UpdateProjectRequestDto {
  @ApiPropertyOptional({ example: 'Application Binary Interface' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated context for ABI-related API breakage checks.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['abi', 'binary-compatibility'],
  })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  keywords?: string[];
}
