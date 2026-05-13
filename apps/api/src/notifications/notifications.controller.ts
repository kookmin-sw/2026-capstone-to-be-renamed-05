import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'unreadOnly', required: false, example: false })
  list(@Req() req: RequestWithUser, @Query() query: ListNotificationsDto) {
    return this.notificationsService.list(req.user!.id, query);
  }

  @Get('unread-count')
  unreadCount(@Req() req: RequestWithUser) {
    return this.notificationsService.unreadCount(req.user!.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user!.id);
  }

  @Patch(':id/read')
  markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user!.id, id);
  }

  @Get('tag-subscriptions')
  listTagSubscriptions(@Req() req: RequestWithUser) {
    return this.notificationsService.listTagSubscriptions(req.user!.id);
  }

  @Put('tag-subscriptions/:labelId')
  subscribeTag(@Req() req: RequestWithUser, @Param('labelId') labelId: string) {
    return this.notificationsService.subscribeTag(req.user!.id, labelId);
  }

  @Delete('tag-subscriptions/:labelId')
  unsubscribeTag(
    @Req() req: RequestWithUser,
    @Param('labelId') labelId: string,
  ) {
    return this.notificationsService.unsubscribeTag(req.user!.id, labelId);
  }
}
