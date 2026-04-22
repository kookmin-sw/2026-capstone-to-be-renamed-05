import { ApiProperty } from '@nestjs/swagger';

export class GitHubLoginResponseDto {
  @ApiProperty({
    example:
      'https://github.com/login/oauth/authorize?client_id=...&scope=repo,read:user,user:email&state=...',
  })
  redirectUrl: string;

  @ApiProperty({ example: 'v5eO8XrrJQpW7...' })
  state: string;
}

export class AuthMeResponseDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'pookjw' })
  login: string;

  @ApiProperty({ example: 'pookjw@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'https://avatars.githubusercontent.com/u/123456?v=4', required: false })
  avatarUrl?: string;
}

export class AuthCallbackResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AuthMeResponseDto })
  user: AuthMeResponseDto;
}
