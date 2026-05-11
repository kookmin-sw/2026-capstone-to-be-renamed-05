import { CommunityBoardType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCommunityPostDto {
  @IsEnum(CommunityBoardType)
  boardType!: CommunityBoardType;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
