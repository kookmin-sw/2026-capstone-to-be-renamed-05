import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ActionResultDto } from '../common/dto/action-result.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  AuthRedirectResponseDto,
  MeResponseDto,
  SwitchAccountRequestDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('github/login')
  @ApiOperation({
    summary: 'Get GitHub login URL',
    description: 'Returns GitHub OAuth login URL for frontend redirect.',
  })
  @ApiOkResponse({
    description: 'OAuth redirect URL.',
    type: AuthRedirectResponseDto,
  })
  getGithubLoginUrl(): AuthRedirectResponseDto {
    return {
      redirectUrl:
        'https://github.com/login/oauth/authorize?client_id=tidyx-demo&scope=repo',
    };
  }

  @Get('github/callback')
  @ApiOperation({
    summary: 'Handle GitHub OAuth callback',
    description:
      'Exchanges authorization code and initializes user session (stub response in spec phase).',
  })
  @ApiOkResponse({
    description: 'OAuth callback handled.',
    type: ActionResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid OAuth callback parameters.',
    type: ApiErrorResponseDto,
  })
  handleGithubCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): ActionResultDto {
    void code;
    void state;
    return {
      success: true,
      message: 'OAuth callback processed and session issued.',
    };
  }

  @Post('logout')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes current session.',
  })
  @ApiOkResponse({
    description: 'Session revoked.',
    type: ActionResultDto,
  })
  logout(): ActionResultDto {
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  @Post('switch-account')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Switch active account',
    description:
      'Switches current account context in console menu (personal/org).',
  })
  @ApiOkResponse({
    description: 'Account switched.',
    type: ActionResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid account ID.',
    type: ApiErrorResponseDto,
  })
  switchAccount(@Body() request: SwitchAccountRequestDto): ActionResultDto {
    return {
      success: true,
      message: `Active account switched to ${request.accountId}.`,
    };
  }
}

@ApiTags('Menu')
@ApiBearerAuth('bearer')
@Controller()
export class MenuController {
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns current user info and account list used in menu account switch UI.',
  })
  @ApiOkResponse({
    description: 'Current user profile.',
    type: MeResponseDto,
  })
  getMe(): MeResponseDto {
    return {
      userId: 'usr_001',
      email: 'alice@example.com',
      activeAccountId: 'acc_001',
      accounts: [
        {
          id: 'acc_001',
          login: 'alice',
          type: 'PERSONAL',
        },
        {
          id: 'acc_org_swiftlang',
          login: 'swiftlang',
          type: 'ORGANIZATION',
        },
      ],
    };
  }
}
