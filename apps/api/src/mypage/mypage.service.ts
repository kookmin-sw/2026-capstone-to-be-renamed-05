import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookmarkTargetType } from '@prisma/client';
import type {
  BookmarkItem,
  BookmarkListResponse,
  MyProfileResponse,
  ResumeItem,
  ResumeListResponse,
} from '@cpa/shared';
import { PrismaService } from '../prisma/prisma.service';

const RESUME_LIMIT = 5;

@Injectable()
export class MypageService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<MyProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string },
  ): Promise<MyProfileResponse> {
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  // ─── Bookmarks ───────────────────────────────────────────

  async listBookmarks(
    userId: string,
    targetType?: BookmarkTargetType,
  ): Promise<BookmarkListResponse> {
    const where: Record<string, unknown> = { userId };
    if (targetType) where.targetType = targetType;

    const bookmarks = await this.prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const items: BookmarkItem[] = await Promise.all(
      bookmarks.map((bm) => this.enrichBookmark(bm)),
    );

    return { items };
  }

  async createBookmark(
    userId: string,
    targetType: BookmarkTargetType,
    targetId: string,
  ): Promise<BookmarkItem> {
    // 대상 존재 확인
    await this.validateBookmarkTarget(targetType, targetId);

    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_targetType_targetId: { userId, targetType, targetId },
      },
    });
    if (existing) {
      throw new ConflictException('이미 북마크에 추가된 항목입니다.');
    }

    const bookmark = await this.prisma.bookmark.create({
      data: { userId, targetType, targetId },
    });

    return this.enrichBookmark(bookmark);
  }

  async deleteBookmark(userId: string, id: string): Promise<{ ok: boolean }> {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId },
    });
    if (!bookmark) {
      throw new NotFoundException('북마크를 찾을 수 없습니다.');
    }
    await this.prisma.bookmark.delete({ where: { id } });
    return { ok: true };
  }

  private async validateBookmarkTarget(
    targetType: BookmarkTargetType,
    targetId: string,
  ) {
    if (targetType === BookmarkTargetType.JOB) {
      const job = await this.prisma.job.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!job) throw new BadRequestException('존재하지 않는 공고입니다.');
    } else {
      const company = await this.prisma.company.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!company) throw new BadRequestException('존재하지 않는 회사입니다.');
    }
  }

  private async enrichBookmark(bookmark: {
    id: string;
    targetType: BookmarkTargetType;
    targetId: string;
    createdAt: Date;
  }): Promise<BookmarkItem> {
    let targetTitle = '(삭제됨)';
    let targetSubtitle: string | null = null;

    if (bookmark.targetType === BookmarkTargetType.JOB) {
      const job = await this.prisma.job.findUnique({
        where: { id: bookmark.targetId },
        select: { title: true, company: { select: { name: true } } },
      });
      if (job) {
        targetTitle = job.title;
        targetSubtitle = job.company.name;
      }
    } else {
      const company = await this.prisma.company.findUnique({
        where: { id: bookmark.targetId },
        select: { name: true, type: true },
      });
      if (company) {
        targetTitle = company.name;
        targetSubtitle = company.type;
      }
    }

    return {
      id: bookmark.id,
      targetType: bookmark.targetType,
      targetId: bookmark.targetId,
      targetTitle,
      targetSubtitle,
      createdAt: bookmark.createdAt.toISOString(),
    };
  }

  // ─── Resumes ─────────────────────────────────────────────

  async listResumes(userId: string): Promise<ResumeListResponse> {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: resumes.map((r) => this.toResumeItem(r)),
    };
  }

  async createResume(
    userId: string,
    data: { fileName: string; contentType: string; byteSize: number },
  ): Promise<ResumeItem> {
    const count = await this.prisma.resume.count({ where: { userId } });
    if (count >= RESUME_LIMIT) {
      throw new BadRequestException(
        `이력서는 최대 ${RESUME_LIMIT}개까지 업로드할 수 있습니다.`,
      );
    }

    // 실제 파일 업로드는 클라이언트에서 직접 처리하고 URL을 전달받는 구조
    // MVP에서는 fileUrl을 서버에서 생성 (로컬 저장 경로)
    const fileUrl = `/uploads/resumes/${userId}/${Date.now()}_${data.fileName}`;

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        fileName: data.fileName,
        fileUrl,
        contentType: data.contentType,
        byteSize: data.byteSize,
      },
    });

    return this.toResumeItem(resume);
  }

  async deleteResume(userId: string, id: string): Promise<{ ok: boolean }> {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('이력서를 찾을 수 없습니다.');
    }
    await this.prisma.resume.delete({ where: { id } });
    return { ok: true };
  }

  private toResumeItem(resume: {
    id: string;
    fileName: string;
    fileUrl: string;
    contentType: string;
    byteSize: number;
    createdAt: Date;
    updatedAt: Date;
  }): ResumeItem {
    return {
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      contentType: resume.contentType,
      byteSize: resume.byteSize,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }
}
