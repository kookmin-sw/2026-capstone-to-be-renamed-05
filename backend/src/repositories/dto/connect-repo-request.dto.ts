import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConnectRepositoryRequestDto {
  @ApiProperty({ example: 'swiftlang/swift' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)
  fullName: string;
}
