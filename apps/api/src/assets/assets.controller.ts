import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssetsService } from './assets.service';
import { CreateCompanyBackgroundUploadUrlDto } from './dto/create-company-background-upload-url.dto';
import { CreateCompanyLogoUploadUrlDto } from './dto/create-company-logo-upload-url.dto';
import { CreateProfileImageUploadUrlDto } from './dto/create-profile-image-upload-url.dto';
import { COMPANY_BACKGROUND_MAX_BYTES } from './logo-asset.constants';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Roles(UserRole.COMPANY)
  @Post('company-logo/upload-url')
  createCompanyLogoUploadUrl(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCompanyLogoUploadUrlDto,
  ) {
    return this.assetsService.createCompanyLogoUploadUrl(req.user!.id, dto);
  }

  @Roles(UserRole.COMPANY)
  @Post('company-background/upload-url')
  createCompanyBackgroundUploadUrl(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCompanyBackgroundUploadUrlDto,
  ) {
    return this.assetsService.createCompanyBackgroundUploadUrl(
      req.user!.id,
      dto,
    );
  }

  @Roles(UserRole.JOB_SEEKER)
  @Post('profile-image/upload-url')
  createProfileImageUploadUrl(
    @Req() req: RequestWithUser,
    @Body() dto: CreateProfileImageUploadUrlDto,
  ) {
    return this.assetsService.createProfileImageUploadUrl(req.user!.id, dto);
  }

  @Roles(UserRole.COMPANY, UserRole.JOB_SEEKER)
  @Post(':id/complete')
  completeUpload(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.completeUpload(req.user!.id, id);
  }

  @Roles(UserRole.COMPANY, UserRole.JOB_SEEKER)
  @Put(':id/local-upload')
  async uploadLocalAsset(@Req() req: RequestWithUser, @Param('id') id: string) {
    const body = await readRequestBody(req, COMPANY_BACKGROUND_MAX_BYTES + 1);
    return this.assetsService.uploadLocalAsset(
      req.user!.id,
      id,
      body,
      req.headers['content-type'],
    );
  }
}

async function readRequestBody(req: RequestWithUser, limitBytes: number) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > limitBytes) {
      throw new BadRequestException(
        'Company image uploads are larger than the allowed limit.',
      );
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}
