import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { BookmarkTargetType } from '@prisma/client';

export class CreateBookmarkDto {
  @ApiProperty({ enum: ['JOB', 'COMPANY'], example: 'JOB' })
  @IsEnum(BookmarkTargetType)
  targetType!: BookmarkTargetType;

  @ApiProperty({ example: 'uuid-of-job-or-company' })
  @IsString()
  targetId!: string;
}
