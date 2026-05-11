import { IsString } from 'class-validator';

export class ResolveCommunityPostDto {
  @IsString()
  answerId!: string;
}
