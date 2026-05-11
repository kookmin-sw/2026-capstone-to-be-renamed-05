import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookmarkTargetType } from '@prisma/client';
import type {
  BookmarkItem,
  BookmarkListResponse,
  MyProfileResponse,
  ResumeItem,
  ResumeListResponse,
} from '@cpa/shared';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  resolve,
  sep,
} from 'node:path';
import { resolveWorkspaceRoot } from '../config/runtime-environment';
import { PrismaService } from '../prisma/prisma.service';

const RESUME_LIMIT = 5;
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;

const RESUME_CONTENT_TYPES_BY_EXTENSION = new Map<string, Set<string>>([
  ['.pdf', new Set(['application/pdf'])],
  ['.doc', new Set(['application/msword'])],
  [
    '.docx',
    new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ]),
  ],
  [
    '.hwp',
    new Set([
      'application/haansofthwp',
      'application/hwp',
      'application/vnd.hancom.hwp',
      'application/x-hwp',
    ]),
  ],
  ['.hwpx', new Set(['application/vnd.hancom.hwpx', 'application/zip'])],
]);

const FALLBACK_RESUME_CONTENT_TYPE = 'application/octet-stream';

@Injectable()
export class MypageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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
    data: {
      fileName: string;
      contentType: string | string[] | undefined;
      body: Buffer;
    },
  ): Promise<ResumeItem> {
    const upload = this.normalizeResumeUpload(data);
    const count = await this.prisma.resume.count({ where: { userId } });
    if (count >= RESUME_LIMIT) {
      throw new BadRequestException(
        `이력서는 최대 ${RESUME_LIMIT}개까지 업로드할 수 있습니다.`,
      );
    }

    const id = randomUUID();
    const targetPath = this.resolveStoredResumePath(
      userId,
      id,
      upload.fileName,
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, data.body, { flag: 'wx' });

    try {
      const resume = await this.prisma.resume.create({
        data: {
          id,
          userId,
          fileName: upload.fileName,
          fileUrl: this.buildResumeDownloadPath(id),
          contentType: upload.contentType,
          byteSize: data.body.length,
        },
      });

      return this.toResumeItem(resume);
    } catch (error) {
      await rm(targetPath, { force: true });
      throw error;
    }
  }

  async getResumeDownload(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('이력서를 찾을 수 없습니다.');
    }

    const filePath = this.resolveStoredResumePath(
      resume.userId,
      resume.id,
      resume.fileName,
    );

    try {
      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Stored resume is not a file.');
      return {
        item: this.toResumeItem(resume),
        filePath,
        byteSize: file.size,
      };
    } catch {
      throw new NotFoundException('이력서 파일을 찾을 수 없습니다.');
    }
  }

  async deleteResume(userId: string, id: string): Promise<{ ok: boolean }> {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('이력서를 찾을 수 없습니다.');
    }
    await this.prisma.resume.delete({ where: { id } });
    const filePath = this.resolveStoredResumePath(
      resume.userId,
      resume.id,
      resume.fileName,
    );
    await rm(filePath, { force: true }).catch(() => undefined);
    return { ok: true };
  }

  private normalizeResumeUpload(data: {
    fileName: string;
    contentType: string | string[] | undefined;
    body: Buffer;
  }) {
    const fileName = this.normalizeOriginalName(data.fileName);
    if (!fileName) {
      throw new BadRequestException('이력서 파일명이 필요합니다.');
    }

    const extension = extname(fileName).toLowerCase();
    const allowedContentTypes =
      RESUME_CONTENT_TYPES_BY_EXTENSION.get(extension);
    if (!allowedContentTypes) {
      throw new BadRequestException(
        '이력서는 PDF, DOC, DOCX, HWP, HWPX 파일만 업로드할 수 있습니다.',
      );
    }
    if (data.body.length <= 0) {
      throw new BadRequestException('빈 이력서 파일은 업로드할 수 없습니다.');
    }
    if (data.body.length > RESUME_MAX_BYTES) {
      throw new BadRequestException('이력서는 10MB 이하로 업로드해 주세요.');
    }

    const contentType =
      this.parseContentTypeHeader(data.contentType) ??
      FALLBACK_RESUME_CONTENT_TYPE;
    if (
      contentType !== FALLBACK_RESUME_CONTENT_TYPE &&
      !allowedContentTypes.has(contentType)
    ) {
      throw new BadRequestException(
        '이력서 파일 형식과 확장자가 일치하지 않습니다.',
      );
    }

    return { fileName, contentType };
  }

  private normalizeOriginalName(fileName: string) {
    const pathlessName = basename(fileName.replace(/\\/g, '/'));
    const cleaned = pathlessName
      .split('')
      .filter((char) => {
        const codePoint = char.charCodeAt(0);
        return codePoint >= 32 && codePoint !== 127;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return '';

    const extension = extname(cleaned);
    if (cleaned.length <= 180 || !extension) return cleaned.slice(0, 180);
    return `${cleaned.slice(0, 180 - extension.length)}${extension}`;
  }

  private parseContentTypeHeader(value: string | string[] | undefined) {
    const rawValue = Array.isArray(value) ? value[0] : value;
    return rawValue?.split(';')[0]?.trim().toLowerCase() || undefined;
  }

  private buildResumeDownloadPath(id: string) {
    return `/mypage/resumes/${encodeURIComponent(id)}/download`;
  }

  private resolveStoredResumePath(
    userId: string,
    resumeId: string,
    fileName: string,
  ) {
    const extension = extname(fileName).toLowerCase();
    const rootPath = resolve(this.getResumeRootDir());
    const targetPath = resolve(rootPath, userId, `${resumeId}${extension}`);
    if (
      targetPath !== rootPath &&
      !targetPath.startsWith(`${rootPath}${sep}`)
    ) {
      throw new BadRequestException('이력서 저장 경로가 올바르지 않습니다.');
    }
    return targetPath;
  }

  private getResumeRootDir() {
    const workspaceRoot = resolveWorkspaceRoot();
    const configuredPath = this.config.get<string>('LOCAL_RESUME_DIR')?.trim();
    if (!configuredPath) {
      return join(workspaceRoot, 'var', 'uploads', 'resumes');
    }
    return isAbsolute(configuredPath)
      ? configuredPath
      : join(workspaceRoot, configuredPath);
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
