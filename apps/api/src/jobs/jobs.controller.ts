import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '../auth/auth.types';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateJobEngagementDto } from './dto/create-job-engagement.dto';
import { ListJobCalendarDto } from './dto/list-job-calendar.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  list(@Query() query: ListJobsDto) {
    return this.jobsService.list(query);
  }

  @Get('calendar')
  calendar(@Query() query: ListJobCalendarDto) {
    return this.jobsService.calendar(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.jobsService.detail(id);
  }

  @Post(':id/engagements')
  @UseGuards(OptionalJwtAuthGuard)
  recordEngagement(
    @Param('id') id: string,
    @Body() dto: CreateJobEngagementDto,
    @Req() req: RequestWithUser,
  ) {
    return this.jobsService.recordEngagement(id, dto.type, req.user?.id);
  }
}
