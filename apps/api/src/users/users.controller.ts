import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateJobPresetDto } from './dto/create-job-preset.dto';
import { UpdateJobFilterPreferenceDto } from './dto/update-job-filter-preference.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('me/job-filter')
  getJobFilter(@Req() req: RequestWithUser) {
    if (!req.user) return { filter: null, authenticated: false };
    return this.usersService.getJobFilterPreference(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/job-filter')
  updateJobFilter(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateJobFilterPreferenceDto,
  ) {
    return this.usersService.updateJobFilterPreference(
      req.user!.id,
      dto.filter,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Get('me/job-presets')
  listJobPresets(@Req() req: RequestWithUser) {
    return this.usersService.listJobPresets(req.user!.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Post('me/job-presets')
  createJobPreset(
    @Req() req: RequestWithUser,
    @Body() dto: CreateJobPresetDto,
  ) {
    return this.usersService.createJobPreset(
      req.user!.id,
      dto.filter,
      dto.name,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Patch('me/job-presets/:id/use')
  markJobPresetUsed(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.markJobPresetUsed(req.user!.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JOB_SEEKER)
  @Delete('me/job-presets/:id')
  deleteJobPreset(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.deleteJobPreset(req.user!.id, id);
  }
}
