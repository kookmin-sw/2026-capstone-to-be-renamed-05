import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AuthRedirectResponseDto {
  @ApiProperty({
    example: 'https://github.com/login/oauth/authorize?client_id=...',
  })
  redirectUrl: string;
}

export class AccountDto {
  @ApiProperty({ example: 'acc_001' })
  id: string;

  @ApiProperty({ example: 'alice' })
  login: string;

  @ApiProperty({ example: 'PERSONAL' })
  type: 'PERSONAL' | 'ORGANIZATION';
}

export class MeResponseDto {
  @ApiProperty({ example: 'usr_001' })
  userId: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ type: [AccountDto] })
  accounts: AccountDto[];

  @ApiProperty({ example: 'acc_001' })
  activeAccountId: string;
}

export class SwitchAccountRequestDto {
  @ApiProperty({ example: 'acc_org_swiftlang' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  accountId: string;
}
