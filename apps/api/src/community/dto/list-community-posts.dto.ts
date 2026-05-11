import { CommunityBoardType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListCommunityPostsDto {
  @IsOptional()
  @IsEnum(CommunityBoardType)
  board?: CommunityBoardType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['latest', 'popular'])
  sort?: 'latest' | 'popular';
}
