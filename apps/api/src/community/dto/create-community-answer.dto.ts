import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityAnswerDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
