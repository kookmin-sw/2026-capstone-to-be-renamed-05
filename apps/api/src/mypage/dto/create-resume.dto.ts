import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({ example: '이력서_김철수.pdf' })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  contentType!: string;

  @ApiProperty({ example: 512000 })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB
  byteSize!: number;
}
