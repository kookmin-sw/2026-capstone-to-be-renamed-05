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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookmarkTargetType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MypageService } from './mypage.service';

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
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.mypageService.updateProfile(req.user!.id, dto);
  }

  // ─── Bookmarks ───────────────────────────────────────────

  @Get('bookmarks')
  @ApiQuery({ name: 'type', enum: ['JOB', 'COMPANY'], required: false })
  listBookmarks(
    @Req() req: RequestWithUser,
    @Query('type') type?: string,
  ) {
    const targetType =
      type === 'JOB'
        ? BookmarkTargetType.JOB
        : type === 'COMPANY'
          ? BookmarkTargetType.COMPANY
          : undefined;
    return this.mypageService.listBookmarks(req.user!.id, targetType);
  }

  @Post('bookmarks')
  createBookmark(
    @Req() req: RequestWithUser,
    @Body() dto: CreateBookmarkDto,
  ) {
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
  createResume(@Req() req: RequestWithUser, @Body() dto: CreateResumeDto) {
    return this.mypageService.createResume(req.user!.id, dto);
  }

  @Delete('resumes/:id')
  deleteResume(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.mypageService.deleteResume(req.user!.id, id);
  }
}
