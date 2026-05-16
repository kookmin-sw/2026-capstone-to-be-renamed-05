import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import {
  AssetPurpose,
  AssetStatus,
  BookmarkTargetType,
  CpaVerificationStatus,
  EmploymentHistoryStatus,
  JobEngagementEventType,
  JobStatus,
  PersonalVerificationRequestStatus,
  Prisma,
} from '@prisma/client';
import type {
  BookmarkItem,
  BookmarkListResponse,
  CreateJobFitAnalysisResponse,
  JobFitAnalysisItem,
  JobFitAnalysisListResponse,
  MyCommunityActivityListResponse,
  MyProfileResponse,
  PersonalVerificationRequestItem,
  ResumeItem,
  ResumeListResponse,
} from '@cpa/shared';
import {
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_ANALYSIS_MAX_CHARS,
  RESUME_ANALYSIS_MAX_PAGES,
  RESUME_ANALYSIS_MIN_CHARS,
  RESUME_UPLOAD_LIMIT,
  RESUME_UPLOAD_MAX_BYTES,
} from '@cpa/shared';
import argon2 from 'argon2';
import mammoth from 'mammoth';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  resolve,
  sep,
} from 'node:path';
import { Readable } from 'node:stream';
import {
  resolveRuntimeEnvironment,
  resolveWorkspaceRoot,
} from '../config/runtime-environment';
import { PDFParse } from 'pdf-parse';
import { AssetsService } from '../assets/assets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalVerificationRequestDto } from './dto/create-personal-verification-request.dto';
import { JobFitAnalysisAiService } from './job-fit-analysis-ai.service';

export const RESUME_MAX_BYTES = RESUME_UPLOAD_MAX_BYTES;
const DEFAULT_S3_RESUME_KEY_PREFIX = 'resumes';

type ResumeStorageConfig =
  | {
      driver: 'local';
      rootDir: string;
    }
  | {
      driver: 's3';
      bucket: string;
      region: string;
      keyPrefix: string;
    };

type ResumeObjectTarget =
  | {
      driver: 'local';
      filePath: string;
    }
  | {
      driver: 's3';
      key: string;
    };

type ResumeRecord = {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  byteSize: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const RESUME_CONTENT_TYPES_BY_EXTENSION = new Map<string, Set<string>>([
  ['.pdf', new Set(['application/pdf'])],
  [
    '.docx',
    new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ]),
  ],
  ['.txt', new Set(['text/plain'])],
]);

const FALLBACK_RESUME_CONTENT_TYPE = 'application/octet-stream';

const verificationRequestInclude = {
  user: { select: { username: true, displayName: true } },
  reviewedBy: { select: { username: true } },
} satisfies Prisma.PersonalVerificationRequestInclude;

const profileInclude = {
  profileImageAsset: { select: { id: true, publicUrl: true } },
  personalProfile: true,
  personalVerificationRequests: {
    where: { status: PersonalVerificationRequestStatus.PENDING },
    include: verificationRequestInclude,
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.UserInclude;

const jobFitAnalysisInclude = {
  job: {
    select: {
      id: true,
      title: true,
      companyId: true,
      company: { select: { name: true } },
    },
  },
  resume: { select: { id: true, fileName: true } },
} satisfies Prisma.JobFitAnalysisInclude;

const jobFitAnalysisJobInclude = {
  company: {
    select: {
      name: true,
      type: true,
      tags: true,
      description: true,
    },
  },
  labels: {
    include: {
      label: { select: { name: true } },
    },
  },
} satisfies Prisma.JobInclude;

type ProfileUserRecord = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

type JobFitAnalysisRecord = Prisma.JobFitAnalysisGetPayload<{
  include: typeof jobFitAnalysisInclude;
}>;

type JobFitAnalysisJobRecord = Prisma.JobGetPayload<{
  include: typeof jobFitAnalysisJobInclude;
}>;

type VerificationRequestRecord = Prisma.PersonalVerificationRequestGetPayload<{
  include: typeof verificationRequestInclude;
}>;

type ListCommunityActivityOptions = {
  take?: number;
  page?: number;
  pageSize?: number;
};

@Injectable()
export class MypageService implements OnModuleInit {
  private readonly s3Clients = new Map<string, S3Client>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly assetsService: AssetsService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly jobFitAnalysisAiService?: JobFitAnalysisAiService,
  ) {}

  onModuleInit() {
    if (this.getResumeStorageDriver() === 's3') {
      this.getS3ResumeConfig();
    }
  }

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
    data: {
      displayName?: string;
      profileImageAssetId?: string;
      profileImageUrl?: string | null;
    },
  ): Promise<MyProfileResponse> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null;
    }

    if (data.profileImageAssetId !== undefined) {
      const profileImageAssetId = this.optionalTrimmed(
        data.profileImageAssetId,
      );
      if (!profileImageAssetId) {
        throw new BadRequestException('프로필 사진 자산 ID가 필요합니다.');
      }

      const asset = await this.prisma.asset.findFirst({
        where: {
          id: profileImageAssetId,
          uploadedById: userId,
          purpose: AssetPurpose.USER_PROFILE_IMAGE,
          status: AssetStatus.READY,
        },
        select: { id: true },
      });
      if (!asset) {
        throw new BadRequestException(
          '사용 가능한 프로필 사진 업로드를 찾을 수 없습니다.',
        );
      }

      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profileImageAssetId: true },
      });
      if (
        current?.profileImageAssetId &&
        current.profileImageAssetId !== asset.id
      ) {
        await this.assetsService.deleteAsset(
          userId,
          current.profileImageAssetId,
          [AssetPurpose.USER_PROFILE_IMAGE],
        );
      }

      updateData.profileImageAsset = { connect: { id: asset.id } };
      updateData.profileImageUrl = null;
    } else if (data.profileImageUrl !== undefined) {
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profileImageAssetId: true },
      });
      if (!current) throw new NotFoundException('User not found.');

      if (current.profileImageAssetId) {
        await this.assetsService.deleteAsset(
          userId,
          current.profileImageAssetId,
          [AssetPurpose.USER_PROFILE_IMAGE],
        );
      }

      updateData.profileImageUrl = data.profileImageUrl?.trim() || null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.getProfile(userId);
  }

  async deleteProfileImage(userId: string): Promise<MyProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageAssetId: true, profileImageUrl: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    if (user.profileImageAssetId) {
      await this.assetsService.deleteAsset(userId, user.profileImageAssetId, [
        AssetPurpose.USER_PROFILE_IMAGE,
      ]);
    }

    if (user.profileImageUrl) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { profileImageUrl: null },
      });
    }

    return this.getProfile(userId);
  }

  async updatePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ): Promise<{ ok: boolean }> {
    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException(
        '새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const matches = await argon2.verify(
      user.passwordHash,
      data.currentPassword,
    );
    if (!matches) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(data.newPassword) },
    });

    return { ok: true };
  }

  async listCommunityActivity(
    userId: string,
    options: number | ListCommunityActivityOptions = {},
  ): Promise<MyCommunityActivityListResponse> {
    const normalized =
      typeof options === 'number' ? { take: options } : options;
    const takeMode =
      normalized.take !== undefined &&
      normalized.page === undefined &&
      normalized.pageSize === undefined;
    const page = takeMode ? 1 : this.clampPositiveInt(normalized.page, 1);
    const pageSize = takeMode
      ? this.clampPositiveInt(normalized.take, 20, 50)
      : this.clampPositiveInt(normalized.pageSize, 20, 50);
    const where = { authorId: userId };

    const [total, posts] = await Promise.all([
      this.prisma.communityPost.count({ where }),
      this.prisma.communityPost.findMany({
        where,
        select: {
          id: true,
          boardType: true,
          title: true,
          likeCount: true,
          createdAt: true,
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: posts.map((post) => ({
        id: post.id,
        boardType: post.boardType,
        title: post.title,
        commentCount: post._count.answers,
        likeCount: post.likeCount,
        createdAt: post.createdAt.toISOString(),
      })),
      page,
      pageSize,
      total,
    };
  }

  async listJobFitAnalyses(
    userId: string,
    jobId?: string,
  ): Promise<JobFitAnalysisListResponse> {
    const analyses = await this.prisma.jobFitAnalysis.findMany({
      where: {
        userId,
        ...(jobId?.trim() ? { jobId: jobId.trim() } : {}),
      },
      include: jobFitAnalysisInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      items: analyses.map((analysis) => this.toJobFitAnalysisItem(analysis)),
    };
  }

  async listHighFitJobAnalyses(
    userId: string,
    take?: number,
  ): Promise<JobFitAnalysisListResponse> {
    const analyses = await this.prisma.jobFitAnalysis.findMany({
      where: {
        userId,
        fitScore: { gte: 75 },
      },
      include: jobFitAnalysisInclude,
      orderBy: [{ fitScore: 'desc' }, { createdAt: 'desc' }],
      take: this.clampPositiveInt(take, 5, 10),
    });

    return {
      items: analyses.map((analysis) => this.toJobFitAnalysisItem(analysis)),
    };
  }

  async createJobFitAnalysis(
    userId: string,
    data: { jobId: string; resumeId: string; refresh?: boolean },
  ): Promise<CreateJobFitAnalysisResponse> {
    const jobId = data.jobId.trim();
    const resumeId = data.resumeId.trim();
    const refresh = Boolean(data.refresh);
    if (!jobId || !resumeId) {
      throw new BadRequestException('분석할 공고와 이력서를 선택해 주세요.');
    }

    const existing = await this.prisma.jobFitAnalysis.findUnique({
      where: {
        userId_jobId_resumeId: { userId, jobId, resumeId },
      },
      include: jobFitAnalysisInclude,
    });
    if (existing && !refresh) {
      return {
        item: this.toJobFitAnalysisItem(existing),
        reused: true,
      };
    }

    const [resume, job] = await Promise.all([
      this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
        select: {
          id: true,
          userId: true,
          fileName: true,
          contentType: true,
          byteSize: true,
        },
      }),
      this.prisma.job.findFirst({
        where: { id: jobId, status: JobStatus.OPEN },
        include: jobFitAnalysisJobInclude,
      }),
    ]);

    if (!resume) {
      throw new BadRequestException(
        '본인이 업로드한 이력서만 분석에 사용할 수 있습니다.',
      );
    }
    if (!job) {
      throw new NotFoundException(
        '분석 가능한 공개 채용공고를 찾을 수 없습니다.',
      );
    }

    if (!this.jobFitAnalysisAiService) {
      throw new InternalServerErrorException(
        'AI 적합도 분석 서비스가 설정되지 않았습니다.',
      );
    }

    const generated = await this.jobFitAnalysisAiService.generate({
      job: this.toJobFitAnalysisAiJob(job),
      resume: {
        fileName: resume.fileName,
        contentType: resume.contentType,
        byteSize: resume.byteSize,
        textSample: await this.readResumeTextSample(resume),
      },
    });

    const analysisData = {
      fitScore: generated.fitScore,
      summary: generated.summary,
      strengths: generated.strengths,
      companyPriorities: generated.companyPriorities,
      gaps: generated.gaps,
      recommendation: generated.recommendation,
      rawJson: generated.rawJson as Prisma.InputJsonValue,
    };

    const saved = existing
      ? await this.prisma.jobFitAnalysis.update({
          where: { id: existing.id },
          data: analysisData,
          include: jobFitAnalysisInclude,
        })
      : await this.prisma.jobFitAnalysis.create({
          data: {
            userId,
            jobId,
            resumeId,
            ...analysisData,
          },
          include: jobFitAnalysisInclude,
        });

    return {
      item: this.toJobFitAnalysisItem(saved),
      reused: false,
    };
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
    await this.recordBookmarkEngagement(
      userId,
      targetType,
      targetId,
      JobEngagementEventType.BOOKMARK_ADDED,
    );

    if (targetType === BookmarkTargetType.JOB) {
      await this.notificationsService?.createDeadlineSoonNotificationForUserJob(
        userId,
        targetId,
      );
    }

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
    await this.recordBookmarkEngagement(
      userId,
      bookmark.targetType,
      bookmark.targetId,
      JobEngagementEventType.BOOKMARK_REMOVED,
    );
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

  private async recordBookmarkEngagement(
    userId: string,
    targetType: BookmarkTargetType,
    targetId: string,
    type: JobEngagementEventType,
  ) {
    if (targetType !== BookmarkTargetType.JOB) return;
    const job = await this.prisma.job.findUnique({
      where: { id: targetId },
      select: { id: true, companyId: true },
    });
    if (!job) return;
    await this.prisma.jobEngagementEvent.create({
      data: {
        jobId: job.id,
        companyId: job.companyId,
        type,
        actorUserId: userId,
      },
    });
  }

  async listResumes(userId: string): Promise<ResumeListResponse> {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
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
    if (count >= RESUME_UPLOAD_LIMIT) {
      throw new BadRequestException(
        `You can upload up to ${RESUME_UPLOAD_LIMIT} resumes.`,
      );
    }

    const id = randomUUID();
    const storageConfig = this.getResumeStorageConfig();
    const target = this.resolveResumeObjectTarget(
      storageConfig,
      userId,
      id,
      upload.fileName,
    );
    await this.writeResumeObject(
      storageConfig,
      target,
      upload.contentType,
      data.body,
    );

    try {
      const resume = await this.prisma.resume.create({
        data: {
          id,
          userId,
          fileName: upload.fileName,
          fileUrl: this.buildResumeDownloadPath(id),
          contentType: upload.contentType,
          byteSize: data.body.length,
          isPrimary: count === 0,
        },
      });

      return this.toResumeItem(resume);
    } catch (error) {
      await this.deleteResumeObject(storageConfig, target).catch(
        () => undefined,
      );
      throw error;
    }
  }

  async setPrimaryResume(userId: string, id: string): Promise<ResumeItem> {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.resume.update({
        where: { id },
        data: { isPrimary: true },
      });
    });

    return this.toResumeItem(updated);
  }

  async getResumeDownload(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found.');
    }

    const storageConfig = this.getResumeStorageConfig();
    const target = this.resolveResumeObjectTarget(
      storageConfig,
      resume.userId,
      resume.id,
      resume.fileName,
    );

    if (storageConfig.driver === 's3' && target.driver === 's3') {
      return this.getS3ResumeDownload(storageConfig, target, resume);
    }

    if (target.driver === 'local') {
      return this.getLocalResumeDownload(target.filePath, resume);
    }

    throw new InternalServerErrorException(
      '이력서 저장소 설정이 올바르지 않습니다.',
    );
  }

  async deleteResume(userId: string, id: string): Promise<{ ok: boolean }> {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found.');
    }
    await this.prisma.resume.delete({ where: { id } });
    if (resume.isPrimary) {
      const nextResume = await this.prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextResume) {
        await this.prisma.resume.update({
          where: { id: nextResume.id },
          data: { isPrimary: true },
        });
      }
    }
    const storageConfig = this.getResumeStorageConfig();
    const target = this.resolveResumeObjectTarget(
      storageConfig,
      resume.userId,
      resume.id,
      resume.fileName,
    );
    await this.deleteResumeObject(storageConfig, target).catch(() => undefined);
    return { ok: true };
  }

  private toJobFitAnalysisAiJob(job: JobFitAnalysisJobRecord) {
    return {
      title: job.title,
      description: job.description,
      jobFamily: job.jobFamily,
      employmentType: job.employmentType,
      companyType: job.companyType,
      kicpaCondition: job.kicpaCondition,
      traineeStatus: job.traineeStatus,
      practicalTrainingInstitution: job.practicalTrainingInstitution,
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      location: job.location,
      deadlineType: job.deadlineType,
      deadline: job.deadline?.toISOString() ?? null,
      labels: job.labels.map((item) => item.label.name),
      company: {
        name: job.company.name,
        type: job.company.type,
        tags: job.company.tags,
        description: job.company.description,
      },
    };
  }

  private async readResumeTextSample(resume: {
    id: string;
    userId: string;
    fileName: string;
  }) {
    try {
      return await this.extractResumeTextSample(
        resume.fileName,
        await this.readResumeObjectBuffer(resume),
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        '이력서 파일을 읽지 못했습니다. 다시 업로드한 뒤 분석해 주세요.',
      );
    }
  }

  private async readResumeObjectBuffer(resume: {
    id: string;
    userId: string;
    fileName: string;
  }) {
    const storageConfig = this.getResumeStorageConfig();
    const target = this.resolveResumeObjectTarget(
      storageConfig,
      resume.userId,
      resume.id,
      resume.fileName,
    );

    let buffer: Buffer;

    if (storageConfig.driver === 'local' && target.driver === 'local') {
      buffer = await readFile(target.filePath);
    } else if (storageConfig.driver === 's3' && target.driver === 's3') {
      const output = await this.getS3Client(storageConfig.region).send(
        new GetObjectCommand({
          Bucket: storageConfig.bucket,
          Key: target.key,
        }),
      );
      const stream = await this.toReadableStream(output.Body);
      buffer = await this.readStreamPrefix(stream, RESUME_UPLOAD_MAX_BYTES + 1);
    } else {
      throw new InternalServerErrorException(
        '이력서 저장소 설정이 올바르지 않습니다.',
      );
    }

    if (buffer.length > RESUME_UPLOAD_MAX_BYTES) {
      throw new BadRequestException('Resume files must be 10MB or smaller.');
    }

    return buffer;
  }

  private async readStreamPrefix(stream: Readable, maxBytes: number) {
    const chunks: Buffer[] = [];
    let total = 0;

    for await (const chunk of stream as AsyncIterable<
      Buffer | Uint8Array | string
    >) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = maxBytes - total;
      chunks.push(
        buffer.length > remaining ? buffer.subarray(0, remaining) : buffer,
      );
      total += Math.min(buffer.length, remaining);
      if (total >= maxBytes) {
        stream.destroy();
        break;
      }
    }

    return Buffer.concat(chunks);
  }

  private async extractResumeTextSample(fileName: string, buffer: Buffer) {
    const extension = extname(fileName).toLowerCase();
    const rawText =
      extension === '.txt'
        ? buffer.toString('utf8')
        : extension === '.docx'
          ? await this.extractDocxText(buffer)
          : extension === '.pdf'
            ? await this.extractPdfText(buffer)
            : '';

    if (!rawText) {
      throw new BadRequestException(
        'PDF, DOCX, TXT 이력서만 AI 분석에 사용할 수 있습니다.',
      );
    }

    const cleaned = this.normalizeResumeText(rawText);
    if (cleaned.length < RESUME_ANALYSIS_MIN_CHARS) {
      throw new BadRequestException(
        '이력서 본문 텍스트를 충분히 추출하지 못했습니다. 스캔 PDF가 아닌 텍스트 기반 PDF, DOCX, TXT 파일을 업로드해 주세요.',
      );
    }

    return cleaned.slice(0, RESUME_ANALYSIS_MAX_CHARS);
  }

  private async extractDocxText(buffer: Buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private async extractPdfText(buffer: Buffer) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const info = await parser.getInfo();
      if (info.total > RESUME_ANALYSIS_MAX_PAGES) {
        throw new BadRequestException(
          `PDF 이력서는 ${RESUME_ANALYSIS_MAX_PAGES}쪽 이하만 분석할 수 있습니다.`,
        );
      }

      const result = await parser.getText({
        first: RESUME_ANALYSIS_MAX_PAGES,
        pageJoiner: '\n',
      });
      return result.text;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  private normalizeResumeText(value: string) {
    return value
      .replace(/\r\n/g, '\n')
      .replace(/[^\t\n\r -~가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
        `Only ${RESUME_ALLOWED_EXTENSIONS.map((item) => item.toUpperCase()).join(', ')} resumes can be uploaded. Convert DOC, HWP, and HWPX files before uploading.`,
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

  private resolveResumeObjectTarget(
    config: ResumeStorageConfig,
    userId: string,
    resumeId: string,
    fileName: string,
  ): ResumeObjectTarget {
    if (config.driver === 's3') {
      return {
        driver: 's3',
        key: this.buildS3ResumeKey(config, userId, resumeId, fileName),
      };
    }

    return {
      driver: 'local',
      filePath: this.resolveLocalResumePath(
        config.rootDir,
        userId,
        resumeId,
        fileName,
      ),
    };
  }

  private async writeResumeObject(
    config: ResumeStorageConfig,
    target: ResumeObjectTarget,
    contentType: string,
    body: Buffer,
  ) {
    if (config.driver === 's3' && target.driver === 's3') {
      await this.getS3Client(config.region).send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: target.key,
          Body: body,
          ContentLength: body.length,
          ContentType: contentType,
        }),
      );
      return;
    }

    if (config.driver === 'local' && target.driver === 'local') {
      await mkdir(dirname(target.filePath), { recursive: true });
      await writeFile(target.filePath, body, { flag: 'wx' });
      return;
    }

    throw new InternalServerErrorException(
      '이력서 저장소 설정이 올바르지 않습니다.',
    );
  }

  private async getLocalResumeDownload(filePath: string, resume: ResumeRecord) {
    try {
      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Stored resume is not a file.');
      return {
        item: this.toResumeItem(resume),
        stream: createReadStream(filePath),
        byteSize: file.size,
      };
    } catch {
      throw new NotFoundException('이력서 파일을 찾을 수 없습니다.');
    }
  }

  private async getS3ResumeDownload(
    config: Extract<ResumeStorageConfig, { driver: 's3' }>,
    target: Extract<ResumeObjectTarget, { driver: 's3' }>,
    resume: ResumeRecord,
  ) {
    let output: GetObjectCommandOutput;
    try {
      output = await this.getS3Client(config.region).send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: target.key,
        }),
      );
    } catch {
      throw new NotFoundException('이력서 파일을 찾을 수 없습니다.');
    }

    return {
      item: this.toResumeItem(resume),
      stream: await this.toReadableStream(output.Body),
      byteSize: output.ContentLength ?? resume.byteSize,
    };
  }

  private async deleteResumeObject(
    config: ResumeStorageConfig,
    target: ResumeObjectTarget,
  ) {
    if (config.driver === 's3' && target.driver === 's3') {
      await this.getS3Client(config.region).send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: target.key,
        }),
      );
      return;
    }

    if (config.driver === 'local' && target.driver === 'local') {
      await rm(target.filePath, { force: true });
      return;
    }

    throw new InternalServerErrorException(
      '이력서 저장소 설정이 올바르지 않습니다.',
    );
  }

  private async toReadableStream(body: unknown) {
    if (body instanceof Readable) return body;

    const transformableBody = body as
      | { transformToByteArray?: () => Promise<Uint8Array> }
      | undefined;
    if (transformableBody?.transformToByteArray) {
      return Readable.from(
        Buffer.from(await transformableBody.transformToByteArray()),
      );
    }

    throw new InternalServerErrorException(
      'S3 이력서 파일 응답을 읽을 수 없습니다.',
    );
  }

  private resolveLocalResumePath(
    rootDir: string,
    userId: string,
    resumeId: string,
    fileName: string,
  ) {
    const extension = extname(fileName).toLowerCase();
    const rootPath = resolve(rootDir);
    const targetPath = resolve(rootPath, userId, `${resumeId}${extension}`);
    if (
      targetPath !== rootPath &&
      !targetPath.startsWith(`${rootPath}${sep}`)
    ) {
      throw new BadRequestException('Invalid resume storage path.');
    }
    return targetPath;
  }

  private buildS3ResumeKey(
    config: Extract<ResumeStorageConfig, { driver: 's3' }>,
    userId: string,
    resumeId: string,
    fileName: string,
  ) {
    const extension = extname(fileName).toLowerCase();
    return [
      config.keyPrefix,
      encodeURIComponent(userId),
      `${encodeURIComponent(resumeId)}${extension}`,
    ].join('/');
  }

  private getResumeStorageConfig(): ResumeStorageConfig {
    return this.getResumeStorageDriver() === 's3'
      ? this.getS3ResumeConfig()
      : this.getLocalResumeConfig();
  }

  private getResumeStorageDriver() {
    const configured = this.config
      .get<string>('RESUME_STORAGE_DRIVER')
      ?.trim()
      .toLowerCase();

    if (configured === 's3' || configured === 'local') return configured;
    if (configured) {
      throw new InternalServerErrorException(
        'RESUME_STORAGE_DRIVER must be set to local or s3.',
      );
    }

    return this.getRuntimeEnvironment() === 'aws' ? 's3' : 'local';
  }

  private getRuntimeEnvironment() {
    return resolveRuntimeEnvironment({
      APP_ENV: this.config.get<string>('APP_ENV'),
      RUNTIME_ENV: this.config.get<string>('RUNTIME_ENV'),
      DEPLOY_TARGET: this.config.get<string>('DEPLOY_TARGET'),
      NODE_ENV: this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV,
    });
  }

  private getLocalResumeConfig(): Extract<
    ResumeStorageConfig,
    { driver: 'local' }
  > {
    const workspaceRoot = resolveWorkspaceRoot();
    const configuredPath = this.config.get<string>('LOCAL_RESUME_DIR')?.trim();
    return {
      driver: 'local' as const,
      rootDir: !configuredPath
        ? join(workspaceRoot, 'var', 'uploads', 'resumes')
        : isAbsolute(configuredPath)
          ? configuredPath
          : join(workspaceRoot, configuredPath),
    };
  }

  private getS3ResumeConfig(): Extract<ResumeStorageConfig, { driver: 's3' }> {
    const region = this.config.get<string>('AWS_REGION')?.trim();
    const bucket = this.config.get<string>('S3_RESUME_BUCKET')?.trim();
    const keyPrefix =
      this.config
        .get<string>('S3_RESUME_KEY_PREFIX')
        ?.trim()
        .replace(/^\/+|\/+$/g, '') || DEFAULT_S3_RESUME_KEY_PREFIX;

    if (!region || !bucket) {
      throw new InternalServerErrorException(
        'S3 이력서 저장 환경 변수가 설정되지 않았습니다.',
      );
    }

    return { driver: 's3' as const, region, bucket, keyPrefix };
  }

  private getS3Client(region: string) {
    const existing = this.s3Clients.get(region);
    if (existing) return existing;

    const client = new S3Client({ region });
    this.s3Clients.set(region, client);
    return client;
  }

  private optionalTrimmed(value: string | undefined) {
    return value?.trim() || undefined;
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
      profileImageUrl:
        user.profileImageAsset?.publicUrl ?? user.profileImageUrl ?? null,
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
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ResumeItem {
    return {
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      contentType: resume.contentType,
      byteSize: resume.byteSize,
      isPrimary: resume.isPrimary,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }

  private toJobFitAnalysisItem(
    analysis: JobFitAnalysisRecord,
  ): JobFitAnalysisItem {
    return {
      id: analysis.id,
      jobId: analysis.jobId,
      jobTitle: analysis.job.title,
      companyId: analysis.job.companyId,
      companyName: analysis.job.company.name,
      resumeId: analysis.resumeId,
      resumeFileName: analysis.resume.fileName,
      fitScore: analysis.fitScore,
      summary: analysis.summary,
      strengths: analysis.strengths,
      companyPriorities: analysis.companyPriorities,
      gaps: analysis.gaps,
      recommendation: analysis.recommendation,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    };
  }

  private registrationNumberLast4(value: string) {
    const normalized = value.replace(/[^0-9A-Za-z]/g, '');
    return normalized ? normalized.slice(-4) : null;
  }

  private clampPositiveInt(
    value: number | undefined,
    fallback: number,
    max = Number.MAX_SAFE_INTEGER,
  ) {
    const normalized = Math.floor(Number(value));
    if (!Number.isFinite(normalized) || normalized < 1) return fallback;
    return Math.min(normalized, max);
  }
}
