import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ActionResultDto } from '../common/dto/action-result.dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  SyncLabelsRequestDto,
  UpdateLabelSettingsRequestDto,
} from './dto/label-requests.dto';
import {
  LabelListResponseDto,
  LabelSettingsResponseDto,
} from './dto/label.dto';

@ApiTags('Labels')
@ApiBearerAuth('bearer')
@Controller('labels')
export class LabelsController {
  @Get()
  @ApiOperation({
    summary: 'List repository labels',
    description:
      'Returns label set synchronized from provider for current repository context.',
  })
  @ApiOkResponse({
    description: 'Label list.',
    type: LabelListResponseDto,
  })
  listLabels(@Query('repoId') repoId?: string): LabelListResponseDto {
    void repoId;
    const items = [
      {
        name: 'bug',
        color: 'd73a4a',
        description: 'Something is not working',
        usageCount: 120,
      },
      {
        name: 'feature',
        color: '0e8a16',
        description: 'New feature request',
        usageCount: 70,
      },
      {
        name: 'release',
        color: '5319e7',
        description: 'Release/version update related',
        usageCount: 14,
      },
    ];
    return {
      items,
      total: items.length,
    };
  }

  @Get('settings')
  @ApiOperation({
    summary: 'Get label automation settings',
    description: 'Returns current auto-labeling setting.',
  })
  @ApiOkResponse({
    description: 'Label settings.',
    type: LabelSettingsResponseDto,
  })
  getLabelSettings(): LabelSettingsResponseDto {
    return {
      autoLabelingEnabled: true,
    };
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update label automation settings',
    description: 'Turns auto-labeling on or off.',
  })
  @ApiOkResponse({
    description: 'Label settings updated.',
    type: LabelSettingsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload.',
    type: ApiErrorResponseDto,
  })
  updateLabelSettings(
    @Body() request: UpdateLabelSettingsRequestDto,
  ): LabelSettingsResponseDto {
    return {
      autoLabelingEnabled: request.autoLabelingEnabled,
    };
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Synchronize labels',
    description:
      'Pulls latest labels from provider repository into TidyX-managed label list.',
  })
  @ApiOkResponse({
    description: 'Label sync request accepted.',
    type: ActionResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token.',
    type: ApiErrorResponseDto,
  })
  syncLabels(@Body() request: SyncLabelsRequestDto): ActionResultDto {
    return {
      success: true,
      message: `Label sync triggered for repository ${request.repoId}.`,
    };
  }
}
