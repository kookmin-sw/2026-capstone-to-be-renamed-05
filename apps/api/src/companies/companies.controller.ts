import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyJobSubmissionDto } from './dto/create-company-job-submission.dto';
import { CreateCompanyProfileSubmissionDto } from './dto/create-company-profile-submission.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';
import { UpdateCompanyBackgroundDto } from './dto/update-company-background.dto';
import { UpdateCompanyLogoDto } from './dto/update-company-logo.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  list(@Query() query: ListCompaniesDto) {
    return this.companiesService.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return this.companiesService.me(req.user!.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/profile-submissions')
  createProfileSubmission(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCompanyProfileSubmissionDto,
  ) {
    return this.companiesService.createProfileSubmission(req.user!.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Patch('me/logo')
  updateLogo(@Req() req: RequestWithUser, @Body() dto: UpdateCompanyLogoDto) {
    return this.companiesService.updateLogo(req.user!.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Patch('me/background')
  updateBackground(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCompanyBackgroundDto,
  ) {
    return this.companiesService.updateBackground(req.user!.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/job-submissions')
  createJobSubmission(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCompanyJobSubmissionDto,
  ) {
    return this.companiesService.createJobSubmission(req.user!.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me/job-submissions')
  listMyJobSubmissions(@Req() req: RequestWithUser) {
    return this.companiesService.listMyJobSubmissions(req.user!.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Patch('me/job-submissions/:id')
  updateMyJobSubmission(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateCompanyJobSubmissionDto,
  ) {
    return this.companiesService.updateMyJobSubmission(req.user!.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Delete('me/job-submissions/:id')
  cancelMyJobSubmission(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.cancelMyJobSubmission(req.user!.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me/jobs')
  listMyJobs(@Req() req: RequestWithUser) {
    return this.companiesService.listMyJobs(req.user!.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/jobs/:id/edit-submissions')
  createJobEditSubmission(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateCompanyJobSubmissionDto,
  ) {
    return this.companiesService.createJobEditSubmission(req.user!.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Delete('me/jobs/:id')
  closeMyJob(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.closeMyJob(req.user!.id, id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.companiesService.detail(id);
  }
}
