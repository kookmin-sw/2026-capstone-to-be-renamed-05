import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobStatus, UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  @Get('health')
  health() {
    return { ok: true, area: 'admin' };
  }

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('sources')
  listSources() {
    return this.adminService.listSources();
  }

  @Get('jobs')
  listJobs(@Query() query: Record<string, string | undefined>) {
    return this.adminService.listJobs(query);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.adminService.getJob(id);
  }

  @Post('jobs')
  createJob(@Body() dto: CreateJobDto) {
    return this.adminService.createJob(dto);
  }

  @Patch('jobs/:id')
  updateJob(@Param('id') id: string, @Body() dto: CreateJobDto) {
    return this.adminService.updateJob(id, dto);
  }

  @Patch('jobs/:id/close')
  closeJob(@Param('id') id: string) {
    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.CLOSED },
    });
  }

  @Patch('jobs/:id/status')
  updateJobStatus(
    @Param('id') id: string,
    @Body() body: { status?: JobStatus },
  ) {
    return this.adminService.updateJobStatus(id, body.status);
  }

  @Patch('jobs/:id/refresh')
  refreshJobCheckedAt(@Param('id') id: string) {
    return this.adminService.refreshJobCheckedAt(id);
  }

  @Get('ai-suggestions')
  listAiSuggestions() {
    return this.adminService.listAiSuggestions();
  }

  @Patch('ai-suggestions/:id/approve')
  approveAiSuggestion(@Param('id') id: string) {
    return this.adminService.reviewAiSuggestion(id, 'approve');
  }

  @Patch('ai-suggestions/:id/reject')
  rejectAiSuggestion(@Param('id') id: string) {
    return this.adminService.reviewAiSuggestion(id, 'reject');
  }

  @Get('companies')
  listCompanies(@Query() query: Record<string, string | undefined>) {
    return this.adminService.listCompanies(query);
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.adminService.getCompany(id);
  }

  @Post('companies')
  createCompany(@Body() body: Record<string, unknown>) {
    return this.adminService.createCompany(body);
  }

  @Patch('companies/:id')
  updateCompany(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateCompany(id, body);
  }

  @Get('members')
  listMembers(@Query() query: Record<string, string | undefined>) {
    return this.adminService.listMembers(query);
  }

  @Get('cpa-verification-requests')
  listPersonalVerificationRequests() {
    return this.adminService.listPersonalVerificationRequests();
  }

  @Patch('cpa-verification-requests/:id/approve')
  approvePersonalVerificationRequest(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.approvePersonalVerificationRequest(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }

  @Patch('cpa-verification-requests/:id/reject')
  rejectPersonalVerificationRequest(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.rejectPersonalVerificationRequest(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }

  @Get('job-submissions')
  listJobSubmissions() {
    return this.adminService.listJobSubmissions();
  }

  @Patch('job-submissions/:id/approve')
  approveJobSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.approveJobSubmission(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }

  @Patch('job-submissions/:id/reject')
  rejectJobSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.rejectJobSubmission(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }

  @Get('profile-submissions')
  listProfileSubmissions() {
    return this.adminService.listProfileSubmissions();
  }

  @Patch('profile-submissions/:id/approve')
  approveProfileSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.approveProfileSubmission(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }

  @Patch('profile-submissions/:id/reject')
  rejectProfileSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.rejectProfileSubmission(
      id,
      req.user!.id,
      dto.adminNote,
    );
  }
}
