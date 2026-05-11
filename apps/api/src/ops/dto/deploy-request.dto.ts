import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class DeployRequestDto {
  @ApiProperty({
    example: 'refs/heads/develop',
    description: 'Git ref that triggered the deployment.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^refs\/heads\/.+$/)
  ref!: string;

  @ApiProperty({
    example: '4f1d2c3b4a5e6f7890abc123def4567890abc123',
    description: 'Commit SHA from the triggering GitHub Actions run.',
  })
  @IsString()
  @IsNotEmpty()
  sha!: string;

  @ApiPropertyOptional({
    example: 'octocat',
    description: 'GitHub actor that triggered the deployment.',
  })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'GitHub Actions run id.',
  })
  @IsOptional()
  @IsString()
  runId?: string;
}
