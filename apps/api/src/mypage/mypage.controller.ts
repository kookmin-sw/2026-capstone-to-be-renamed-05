import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookmarkTargetType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreatePersonalVerificationRequestDto } from './dto/create-personal-verification-request.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MypageService, RESUME_MAX_BYTES } from './mypage.service';

@ApiTags('mypage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
@Controller('mypage')
export class MypageController {
  constructor(private readonly mypageService: MypageService) {}

  // ─── Profile ─────────────────────────────────────────────

  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.mypageService.getProfile(req.user!.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.mypageService.updateProfile(req.user!.id, dto);
  }

  @Patch('password')
  updatePassword(@Req() req: RequestWithUser, @Body() dto: UpdatePasswordDto) {
    return this.mypageService.updatePassword(req.user!.id, dto);
  }

  @Get('community-activity')
  @ApiQuery({ name: 'take', required: false, example: 20 })
  listCommunityActivity(
    @Req() req: RequestWithUser,
    @Query('take') take?: string,
  ) {
    return this.mypageService.listCommunityActivity(
      req.user!.id,
      take ? Number(take) : undefined,
    );
  }

  @Post('cpa-verification-requests')
  createPersonalVerificationRequest(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePersonalVerificationRequestDto,
  ) {
    return this.mypageService.createPersonalVerificationRequest(
      req.user!.id,
      dto,
    );
  }

  // ─── Bookmarks ───────────────────────────────────────────

  @Get('bookmarks')
  @ApiQuery({ name: 'type', enum: ['JOB', 'COMPANY'], required: false })
  listBookmarks(@Req() req: RequestWithUser, @Query('type') type?: string) {
    const targetType =
      type === 'JOB'
        ? BookmarkTargetType.JOB
        : type === 'COMPANY'
          ? BookmarkTargetType.COMPANY
          : undefined;
    return this.mypageService.listBookmarks(req.user!.id, targetType);
  }

  @Post('bookmarks')
  createBookmark(@Req() req: RequestWithUser, @Body() dto: CreateBookmarkDto) {
    return this.mypageService.createBookmark(
      req.user!.id,
      dto.targetType,
      dto.targetId,
    );
  }

  @Delete('bookmarks/:id')
  deleteBookmark(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.mypageService.deleteBookmark(req.user!.id, id);
  }

  // ─── Resumes ─────────────────────────────────────────────

  @Get('resumes')
  listResumes(@Req() req: RequestWithUser) {
    return this.mypageService.listResumes(req.user!.id);
  }

  @Post('resumes')
  @ApiConsumes(
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  )
  @ApiHeader({
    name: 'x-file-name',
    description: 'URL-encoded original resume file name.',
    required: true,
  })
  @ApiBody({ schema: { type: 'string', format: 'binary' } })
  async createResume(
    @Req() req: RequestWithUser,
    @Headers('x-file-name') encodedFileName?: string,
  ) {
    const fileName = decodeFileNameHeader(encodedFileName);
    const body = await readRequestBody(req, RESUME_MAX_BYTES + 1);
    return this.mypageService.createResume(req.user!.id, {
      fileName,
      contentType: req.headers['content-type'],
      body,
    });
  }

  @Get('resumes/:id/download')
  async downloadResume(@Req() req: RequestWithUser, @Param('id') id: string) {
    const download = await this.mypageService.getResumeDownload(
      req.user!.id,
      id,
    );
    return new StreamableFile(download.stream, {
      type: download.item.contentType,
      length: download.byteSize,
      disposition: buildContentDisposition(download.item.fileName),
    });
  }

  @Delete('resumes/:id')
  deleteResume(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.mypageService.deleteResume(req.user!.id, id);
  }
}

async function readRequestBody(req: RequestWithUser, limitBytes: number) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > limitBytes) {
      throw new BadRequestException('이력서는 10MB 이하로 업로드해 주세요.');
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function decodeFileNameHeader(value: string | undefined) {
  if (!value) {
    throw new BadRequestException('이력서 파일명이 필요합니다.');
  }
  try {
    return decodeURIComponent(value);
  } catch {
    throw new BadRequestException('이력서 파일명이 올바르지 않습니다.');
  }
}

function buildContentDisposition(fileName: string) {
  const fallbackName =
    fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'resume';
  const encodedName = encodeURIComponent(fileName).replace(
    /['()]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}
