import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookmarkTargetType,
  CpaVerificationStatus,
  EmploymentHistoryStatus,
  PersonalVerificationRequestStatus,
  Prisma,
} from '@prisma/client';
import type {
  BookmarkItem,
  BookmarkListResponse,
  MyProfileResponse,
  PersonalVerificationRequestItem,
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
import { CreatePersonalVerificationRequestDto } from './dto/create-personal-verification-request.dto';

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

const verificationRequestInclude = {
  user: { select: { username: true, displayName: true } },
  reviewedBy: { select: { username: true } },
} satisfies Prisma.PersonalVerificationRequestInclude;

const profileInclude = {
  personalProfile: true,
  personalVerificationRequests: {
    where: { status: PersonalVerificationRequestStatus.PENDING },
    include: verificationRequestInclude,
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.UserInclude;

type ProfileUserRecord = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

type VerificationRequestRecord = Prisma.PersonalVerificationRequestGetPayload<{
  include: typeof verificationRequestInclude;
}>;

@Injectable()
export class MypageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getProfile(userId: string): Promise<MyProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: profileInclude,
    });
    if (!user) throw new NotFoundException('User not found.');
    return this.toProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string },
  ): Promise<MyProfileResponse> {
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.getProfile(userId);
  }

  async createPersonalVerificationRequest(
    userId: string,
    dto: CreatePersonalVerificationRequestDto,
  ): Promise<PersonalVerificationRequestItem> {
    const existingPending =
      await this.prisma.personalVerificationRequest.findFirst({
        where: {
          userId,
          status: PersonalVerificationRequestStatus.PENDING,
        },
        select: { id: true },
      });
    if (existingPending) {
      throw new ConflictException(
        'A pending CPA verification request already exists.',
      );
    }

    const applicantName = dto.applicantName.trim();
    const birthDate = dto.birthDate.trim();
    const registrationNumber = dto.registrationNumber.trim();

    if (!applicantName || !birthDate || !registrationNumber) {
      throw new BadRequestException(
        'CPA verification information is required.',
      );
    }

    const request = await this.prisma.$transaction(async (tx) => {
      await tx.personalProfile.upsert({
        where: { userId },
        update: { cpaVerificationStatus: CpaVerificationStatus.PENDING },
        create: {
          userId,
          cpaVerificationStatus: CpaVerificationStatus.PENDING,
          employmentHistoryStatus: EmploymentHistoryStatus.UNKNOWN,
        },
      });

      return tx.personalVerificationRequest.create({
        data: {
          userId,
          applicantName,
          birthDate,
          registrationNumber,
          registrationNumberLast4:
            this.registrationNumberLast4(registrationNumber),
          requestedCareerStage: dto.requestedCareerStage,
        },
        include: verificationRequestInclude,
      });
    });

    return this.toVerificationRequestItem(request);
  }

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
    await this.validateBookmarkTarget(targetType, targetId);

    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_targetType_targetId: { userId, targetType, targetId },
      },
    });
    if (existing) {
      throw new ConflictException('This item is already bookmarked.');
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
      throw new NotFoundException('Bookmark not found.');
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
      if (!job) throw new BadRequestException('Job does not exist.');
    } else {
      const company = await this.prisma.company.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!company) throw new BadRequestException('Company does not exist.');
    }
  }

  private async enrichBookmark(bookmark: {
    id: string;
    targetType: BookmarkTargetType;
    targetId: string;
    createdAt: Date;
  }): Promise<BookmarkItem> {
    let targetTitle = '(deleted)';
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
        `You can upload up to ${RESUME_LIMIT} resumes.`,
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
      throw new NotFoundException('Resume not found.');
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
      throw new NotFoundException('Resume file not found.');
    }
  }

  async deleteResume(userId: string, id: string): Promise<{ ok: boolean }> {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found.');
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
      throw new BadRequestException('Resume file name is required.');
    }

    const extension = extname(fileName).toLowerCase();
    const allowedContentTypes =
      RESUME_CONTENT_TYPES_BY_EXTENSION.get(extension);
    if (!allowedContentTypes) {
      throw new BadRequestException(
        'Only PDF, DOC, DOCX, HWP, and HWPX resumes can be uploaded.',
      );
    }
    if (data.body.length <= 0) {
      throw new BadRequestException('Empty resume files cannot be uploaded.');
    }
    if (data.body.length > RESUME_MAX_BYTES) {
      throw new BadRequestException('Resume files must be 10MB or smaller.');
    }

    const contentType =
      this.parseContentTypeHeader(data.contentType) ??
      FALLBACK_RESUME_CONTENT_TYPE;
    if (
      contentType !== FALLBACK_RESUME_CONTENT_TYPE &&
      !allowedContentTypes.has(contentType)
    ) {
      throw new BadRequestException(
        'Resume file content type does not match its extension.',
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
      throw new BadRequestException('Invalid resume storage path.');
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

  private toProfileResponse(user: ProfileUserRecord): MyProfileResponse {
    const profile = user.personalProfile;
    const pendingRequest = user.personalVerificationRequests[0] ?? null;
    const cpaVerificationStatus =
      profile?.cpaVerificationStatus ?? CpaVerificationStatus.UNVERIFIED;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      cpaVerificationStatus,
      careerStage: profile?.careerStage ?? null,
      employmentHistoryStatus:
        profile?.employmentHistoryStatus ?? EmploymentHistoryStatus.UNKNOWN,
      verifiedAt: profile?.verifiedAt?.toISOString() ?? null,
      traineeRoomAccess:
        cpaVerificationStatus === CpaVerificationStatus.CPA_VERIFIED,
      pendingVerificationRequest: pendingRequest
        ? this.toVerificationRequestItem(pendingRequest)
        : null,
    };
  }

  private toVerificationRequestItem(
    request: VerificationRequestRecord,
  ): PersonalVerificationRequestItem {
    return {
      id: request.id,
      userId: request.userId,
      username: request.user.username,
      displayName: request.user.displayName,
      applicantName: request.applicantName,
      birthDate: request.birthDate,
      registrationNumber: request.registrationNumber,
      registrationNumberLast4: request.registrationNumberLast4,
      requestedCareerStage: request.requestedCareerStage,
      status: request.status,
      adminNote: request.adminNote,
      reviewedByUsername: request.reviewedBy?.username ?? null,
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
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

  private registrationNumberLast4(value: string) {
    const normalized = value.replace(/[^0-9A-Za-z]/g, '');
    return normalized ? normalized.slice(-4) : null;
  }
}
