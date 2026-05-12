import { CommunityBoardType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const toOptionalBoolean = (value: unknown) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

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

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalBoolean(value))
  @IsBoolean()
  mine?: boolean;
}
