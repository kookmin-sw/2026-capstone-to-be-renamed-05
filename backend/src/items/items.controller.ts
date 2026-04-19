import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { SESSION_COOKIE_NAME } from '../common/auth/session.constants';
import { CloseItemResponseDto } from './dto/close-item-response.dto';
import { ItemsService } from './items.service';

@ApiTags('Items')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post(':id/close')
  @ApiOperation({ summary: 'Close issue or pull request (prototype supports close only)' })
  @ApiOkResponse({ type: CloseItemResponseDto })
  async closeItem(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CloseItemResponseDto> {
    const result = await this.itemsService.closeItem(userId, id);
    return {
      itemId: result.itemId,
      state: result.state,
      closedAt: result.closedAt.toISOString(),
    };
  }
}
