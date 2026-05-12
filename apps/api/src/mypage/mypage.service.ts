import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
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
  BookmarkTargetType,
  CpaVerificationStatus,
  EmploymentHistoryStatus,
  PersonalVerificationRequestStatus,
  Prisma,
} from '@prisma/client';
import type {
  BookmarkItem,
  BookmarkListResponse,
  MyCommunityActivityListResponse,
  MyProfileResponse,
  PersonalVerificationRequestItem,
  ResumeItem,
  ResumeListResponse,
} from '@cpa/shared';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
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
import { Readable } from 'node:stream';
import {
  isServerRuntime,
  resolveWorkspaceRoot,
} from '../config/runtime-environment';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalVerificationRequestDto } from './dto/create-personal-verification-request.dto';

const RESUME_LIMIT = 5;
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;
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
  createdAt: Date;
  updatedAt: Date;
};

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
export class MypageService implements OnModuleInit {
  private readonly s3Clients = new Map<string, S3Client>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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
    data: { displayName?: string; profileImageUrl?: string | null },
  ): Promise<MyProfileResponse> {
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null;
    }
    if (data.profileImageUrl !== undefined) {
      updateData.profileImageUrl = data.profileImageUrl?.trim() || null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

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
    take = 20,
  ): Promise<MyCommunityActivityListResponse> {
    const limit = Math.min(Math.max(Math.floor(take) || 20, 1), 50);
    const posts = await this.prisma.communityPost.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        boardType: true,
        title: true,
        likeCount: true,
        createdAt: true,
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      items: posts.map((post) => ({
        id: post.id,
        boardType: post.boardType,
        title: post.title,
        commentCount: post._count.answers,
        likeCount: post.likeCount,
        createdAt: post.createdAt.toISOString(),
      })),
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

    return isServerRuntime() ? 's3' : 'local';
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

  private toProfileResponse(user: ProfileUserRecord): MyProfileResponse {
    const profile = user.personalProfile;
    const pendingRequest = user.personalVerificationRequests[0] ?? null;
    const cpaVerificationStatus =
      profile?.cpaVerificationStatus ?? CpaVerificationStatus.UNVERIFIED;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
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
