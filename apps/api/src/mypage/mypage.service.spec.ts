import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssetPurpose,
  AssetStatus,
  BookmarkTargetType,
  CpaVerificationStatus,
  CommunityBoardType,
  EmploymentHistoryStatus,
  JobEngagementEventType,
  PersonalCareerStage,
  PersonalVerificationRequestStatus,
  UserRole,
} from '@prisma/client';
import argon2 from 'argon2';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { AssetsService } from '../assets/assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { MypageService, RESUME_MAX_BYTES } from './mypage.service';

const mockS3Send = jest.fn((command: unknown): Promise<unknown> => {
  void command;
  return Promise.resolve(undefined);
});

jest.mock('@aws-sdk/client-s3', () => {
  const actual =
    jest.requireActual<typeof import('@aws-sdk/client-s3')>(
      '@aws-sdk/client-s3',
    );
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  };
});

const createdAt = new Date('2026-05-10T00:00:00.000Z');

describe('MypageService resumes', () => {
  let tempDir: string;
  let prisma: {
    resume: {
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      delete: jest.Mock;
    };
  };
  let assetsService: { deleteAsset: jest.Mock };
  let service: MypageService;

  beforeEach(async () => {
    mockS3Send.mockReset();
    tempDir = await mkdtemp(join(tmpdir(), 'accountit-resumes-'));
    prisma = {
      resume: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };
    assetsService = { deleteAsset: jest.fn() };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      assetsService as unknown as AssetsService,
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('stores uploaded resume files privately and creates a download URL', async () => {
    prisma.resume.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          createdAt,
          updatedAt: createdAt,
        }),
    );

    const result = await service.createResume('user-1', {
      fileName: ' 이력서.pdf ',
      contentType: 'application/pdf',
      body: Buffer.from('%PDF'),
    });

    expect(result.fileName).toBe('이력서.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.byteSize).toBe(4);
    expect(result.fileUrl).toBe(`/mypage/resumes/${result.id}/download`);

    const stored = await readFile(join(tempDir, 'user-1', `${result.id}.pdf`));
    expect(stored.toString()).toBe('%PDF');
  });

  it('rejects unsupported resume files before creating records', async () => {
    await expect(
      service.createResume('user-1', {
        fileName: 'malware.exe',
        contentType: 'application/octet-stream',
        body: Buffer.from('nope'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createResume('user-1', {
        fileName: 'large.pdf',
        contentType: 'application/pdf',
        body: Buffer.alloc(RESUME_MAX_BYTES + 1),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.resume.create).not.toHaveBeenCalled();
  });

  it('returns only the current users resume download metadata', async () => {
    const resume = resumeRecord({ id: 'resume-1', userId: 'user-1' });
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(
      join(tempDir, 'user-1', 'resume-1.pdf'),
      Buffer.from('pdf'),
    );
    prisma.resume.findFirst.mockResolvedValue(resume);

    const result = await service.getResumeDownload('user-1', 'resume-1');

    expect(prisma.resume.findFirst).toHaveBeenCalledWith({
      where: { id: 'resume-1', userId: 'user-1' },
    });
    expect(result.item.id).toBe('resume-1');
    expect(result.byteSize).toBe(3);
    await expect(text(result.stream)).resolves.toBe('pdf');
  });

  it('stores uploaded resume files in S3 when configured', async () => {
    mockS3Send.mockResolvedValueOnce({});
    prisma.resume.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          createdAt,
          updatedAt: createdAt,
        }),
    );
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({
        RESUME_STORAGE_DRIVER: 's3',
        AWS_REGION: 'ap-northeast-2',
        S3_RESUME_BUCKET: 'private-resumes',
      }),
      assetsService as unknown as AssetsService,
    );

    const result = await service.createResume('user-1', {
      fileName: 'resume.pdf',
      contentType: 'application/pdf',
      body: Buffer.from('%PDF'),
    });

    expect(result.fileUrl).toBe(`/mypage/resumes/${result.id}/download`);
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    const command = readS3Command();
    expect(command.constructor.name).toBe('PutObjectCommand');
    expect(command.input).toMatchObject({
      Bucket: 'private-resumes',
      ContentLength: 4,
      ContentType: 'application/pdf',
    });
    expect(command.input.Key).toEqual(
      expect.stringMatching(/^resumes\/user-1\/.+\.pdf$/),
    );
  });

  it('streams resume downloads from S3 when configured', async () => {
    const resume = resumeRecord({ id: 'resume-1', userId: 'user-1' });
    prisma.resume.findFirst.mockResolvedValue(resume);
    mockS3Send.mockResolvedValueOnce({
      Body: Readable.from(Buffer.from('pdf')),
      ContentLength: 3,
    });
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({
        RESUME_STORAGE_DRIVER: 's3',
        AWS_REGION: 'ap-northeast-2',
        S3_RESUME_BUCKET: 'private-resumes',
      }),
      assetsService as unknown as AssetsService,
    );

    const result = await service.getResumeDownload('user-1', 'resume-1');

    expect(result.item.id).toBe('resume-1');
    expect(result.byteSize).toBe(3);
    await expect(text(result.stream)).resolves.toBe('pdf');
    const command = readS3Command();
    expect(command.constructor.name).toBe('GetObjectCommand');
    expect(command.input).toMatchObject({
      Bucket: 'private-resumes',
      Key: 'resumes/user-1/resume-1.pdf',
    });
  });

  it('removes stored resume files when deleting metadata', async () => {
    const resume = resumeRecord({ id: 'resume-1', userId: 'user-1' });
    const filePath = join(tempDir, 'user-1', 'resume-1.pdf');
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(filePath, Buffer.from('pdf'));
    prisma.resume.findFirst.mockResolvedValue(resume);
    prisma.resume.delete.mockResolvedValue(resume);

    await expect(service.deleteResume('user-1', 'resume-1')).resolves.toEqual({
      ok: true,
    });

    await expect(stat(filePath)).rejects.toThrow();
  });

  it('rejects downloads for missing resume metadata', async () => {
    prisma.resume.findFirst.mockResolvedValue(null);

    await expect(
      service.getResumeDownload('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MypageService profile images', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    asset: {
      findFirst: jest.Mock;
    };
  };
  let assetsService: { deleteAsset: jest.Mock };
  let service: MypageService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      asset: {
        findFirst: jest.fn(),
      },
    };
    assetsService = { deleteAsset: jest.fn().mockResolvedValue({ ok: true }) };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({}),
      assetsService as unknown as AssetsService,
    );
  });

  it('connects only a ready owned profile image asset and cleans up the previous image', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 'asset-new' });
    prisma.user.findUnique
      .mockResolvedValueOnce({ profileImageAssetId: 'asset-old' })
      .mockResolvedValueOnce(
        profileUserRecord({
          profileImageAsset: {
            id: 'asset-new',
            publicUrl: 'https://assets.example.com/profile.png',
          },
        }),
      );

    const result = await service.updateProfile('user-1', {
      profileImageAssetId: ' asset-new ',
    });

    expect(prisma.asset.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'asset-new',
        uploadedById: 'user-1',
        purpose: AssetPurpose.USER_PROFILE_IMAGE,
        status: AssetStatus.READY,
      },
      select: { id: true },
    });
    expect(assetsService.deleteAsset).toHaveBeenCalledWith(
      'user-1',
      'asset-old',
      [AssetPurpose.USER_PROFILE_IMAGE],
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        profileImageAsset: { connect: { id: 'asset-new' } },
        profileImageUrl: null,
      },
    });
    expect(result.profileImageUrl).toBe(
      'https://assets.example.com/profile.png',
    );
  });

  it('rejects profile image updates for unavailable assets', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);

    await expect(
      service.updateProfile('user-1', {
        profileImageAssetId: 'asset-new',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(assetsService.deleteAsset).not.toHaveBeenCalled();
  });

  it('deletes the current profile image asset and returns the refreshed profile', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ profileImageAssetId: 'asset-profile-1' })
      .mockResolvedValueOnce(profileUserRecord({ profileImageAsset: null }));

    const result = await service.deleteProfileImage('user-1');

    expect(assetsService.deleteAsset).toHaveBeenCalledWith(
      'user-1',
      'asset-profile-1',
      [AssetPurpose.USER_PROFILE_IMAGE],
    );
    expect(result.profileImageUrl).toBeNull();
  });
});

describe('MypageService CPA verification requests', () => {
  let tx: {
    personalProfile: { upsert: jest.Mock };
    personalVerificationRequest: { create: jest.Mock };
  };
  let prisma: {
    personalVerificationRequest: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: MypageService;

  beforeEach(() => {
    tx = {
      personalProfile: { upsert: jest.fn() },
      personalVerificationRequest: { create: jest.fn() },
    };
    prisma = {
      personalVerificationRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({}),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
    );
  });

  it('creates a pending CPA verification request and stores only a masked suffix separately', async () => {
    tx.personalVerificationRequest.create.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      user: { username: 'jobseeker', displayName: 'CPA user' },
      applicantName: 'Kim CPA',
      birthDate: '1998-03-14',
      registrationNumber: 'CPA-123456',
      registrationNumberLast4: '3456',
      requestedCareerStage: PersonalCareerStage.CPA_UNPLACED,
      status: PersonalVerificationRequestStatus.PENDING,
      adminNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.createPersonalVerificationRequest('user-1', {
      applicantName: ' Kim CPA ',
      birthDate: '1998-03-14',
      registrationNumber: 'CPA-123456',
      requestedCareerStage: PersonalCareerStage.CPA_UNPLACED,
    });

    expect(tx.personalProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: { cpaVerificationStatus: CpaVerificationStatus.PENDING },
      create: {
        userId: 'user-1',
        cpaVerificationStatus: CpaVerificationStatus.PENDING,
        employmentHistoryStatus: EmploymentHistoryStatus.UNKNOWN,
      },
    });
    const createArg = firstMockArg<{
      data: {
        applicantName: string;
        registrationNumberLast4: string | null;
      };
    }>(tx.personalVerificationRequest.create);
    expect(createArg.data.applicantName).toBe('Kim CPA');
    expect(createArg.data.registrationNumberLast4).toBe('3456');
    expect(result.status).toBe(PersonalVerificationRequestStatus.PENDING);
  });

  it('rejects duplicate pending CPA verification requests', async () => {
    prisma.personalVerificationRequest.findFirst.mockResolvedValue({
      id: 'request-1',
    });

    await expect(
      service.createPersonalVerificationRequest('user-1', {
        applicantName: 'Kim CPA',
        birthDate: '1998-03-14',
        registrationNumber: '123456',
        requestedCareerStage: PersonalCareerStage.TRAINEE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.personalVerificationRequest.create).not.toHaveBeenCalled();
  });
});

describe('MypageService account settings', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    communityPost: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let service: MypageService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      communityPost: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn(),
      },
    };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({}),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
    );
  });

  it('changes passwords only after checking the current password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: await argon2.hash('password123'),
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.updatePassword('user-1', {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      }),
    ).resolves.toEqual({ ok: true });

    const updateArg = firstMockArg<{
      where: { id: string };
      data: { passwordHash: string };
    }>(prisma.user.update);
    expect(updateArg.where).toEqual({ id: 'user-1' });
    await expect(
      argon2.verify(updateArg.data.passwordHash, 'newpassword123'),
    ).resolves.toBe(true);
  });

  it('rejects password changes with a wrong current password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: await argon2.hash('password123'),
    });

    await expect(
      service.updatePassword('user-1', {
        currentPassword: 'wrongpass123',
        newPassword: 'newpassword123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('lists the current users community posts in latest order', async () => {
    prisma.communityPost.count.mockResolvedValue(12);
    prisma.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-1',
        boardType: CommunityBoardType.FREE,
        title: '회계법인 면접 후기 공유합니다',
        likeCount: 8,
        createdAt,
        _count: { answers: 12 },
      },
    ]);

    const result = await service.listCommunityActivity('user-1', 5);

    expect(prisma.communityPost.findMany).toHaveBeenCalledWith({
      where: { authorId: 'user-1' },
      select: {
        id: true,
        boardType: true,
        title: true,
        likeCount: true,
        createdAt: true,
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 5,
    });
    expect(result).toEqual({
      items: [
        {
          id: 'post-1',
          boardType: CommunityBoardType.FREE,
          title: '회계법인 면접 후기 공유합니다',
          commentCount: 12,
          likeCount: 8,
          createdAt: createdAt.toISOString(),
        },
      ],
      page: 1,
      pageSize: 5,
      total: 12,
    });
  });

  it('paginates current users community activity', async () => {
    prisma.communityPost.count.mockResolvedValue(12);
    prisma.communityPost.findMany.mockResolvedValue([]);

    const result = await service.listCommunityActivity('user-1', {
      page: 2,
      pageSize: 10,
    });

    expect(prisma.communityPost.count).toHaveBeenCalledWith({
      where: { authorId: 'user-1' },
    });
    expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toMatchObject({
      items: [],
      page: 2,
      pageSize: 10,
      total: 12,
    });
  });
});

describe('MypageService bookmark engagement analytics', () => {
  let prisma: {
    bookmark: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    job: {
      findUnique: jest.Mock;
    };
    company: {
      findUnique: jest.Mock;
    };
    jobEngagementEvent: {
      create: jest.Mock;
    };
  };
  let service: MypageService;

  beforeEach(() => {
    prisma = {
      bookmark: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      job: {
        findUnique: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
      },
      jobEngagementEvent: {
        create: jest.fn(),
      },
    };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({}),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
    );
  });

  it('records a bookmark-added event for job bookmarks without exposing it in the response', async () => {
    prisma.bookmark.findUnique.mockResolvedValue(null);
    prisma.bookmark.create.mockResolvedValue({
      id: 'bookmark-1',
      targetType: BookmarkTargetType.JOB,
      targetId: 'job-1',
      createdAt,
    });
    prisma.job.findUnique
      .mockResolvedValueOnce({ id: 'job-1' })
      .mockResolvedValueOnce({ id: 'job-1', companyId: 'company-1' })
      .mockResolvedValueOnce({
        title: '감사 공고',
        company: { name: '테스트회계법인' },
      });

    const result = await service.createBookmark(
      'user-1',
      BookmarkTargetType.JOB,
      'job-1',
    );

    expect(prisma.jobEngagementEvent.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        companyId: 'company-1',
        type: JobEngagementEventType.BOOKMARK_ADDED,
        actorUserId: 'user-1',
      },
    });
    expect(result).toEqual({
      id: 'bookmark-1',
      targetType: BookmarkTargetType.JOB,
      targetId: 'job-1',
      targetTitle: '감사 공고',
      targetSubtitle: '테스트회계법인',
      createdAt: createdAt.toISOString(),
    });
  });

  it('records a bookmark-removed event for job bookmarks only', async () => {
    prisma.bookmark.findFirst.mockResolvedValue({
      id: 'bookmark-1',
      targetType: BookmarkTargetType.JOB,
      targetId: 'job-1',
      createdAt,
    });
    prisma.bookmark.delete.mockResolvedValue({ id: 'bookmark-1' });
    prisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      companyId: 'company-1',
    });

    await expect(
      service.deleteBookmark('user-1', 'bookmark-1'),
    ).resolves.toEqual({ ok: true });

    expect(prisma.jobEngagementEvent.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        companyId: 'company-1',
        type: JobEngagementEventType.BOOKMARK_REMOVED,
        actorUserId: 'user-1',
      },
    });
  });

  it('does not record engagement events for company bookmarks', async () => {
    prisma.bookmark.findUnique.mockResolvedValue(null);
    prisma.bookmark.create.mockResolvedValue({
      id: 'bookmark-company-1',
      targetType: BookmarkTargetType.COMPANY,
      targetId: 'company-1',
      createdAt,
    });
    prisma.company.findUnique
      .mockResolvedValueOnce({ id: 'company-1' })
      .mockResolvedValueOnce({
        name: '테스트회계법인',
        type: 'LOCAL_ACCOUNTING_FIRM',
      });

    await service.createBookmark(
      'user-1',
      BookmarkTargetType.COMPANY,
      'company-1',
    );

    expect(prisma.jobEngagementEvent.create).not.toHaveBeenCalled();
  });
});

function resumeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'resume-1',
    userId: 'user-1',
    fileName: '이력서.pdf',
    fileUrl: '/mypage/resumes/resume-1/download',
    contentType: 'application/pdf',
    byteSize: 3,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function profileUserRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    username: 'jobseeker',
    displayName: '수습 CPA',
    role: UserRole.JOB_SEEKER,
    createdAt,
    personalProfile: null,
    personalVerificationRequests: [],
    profileImageAsset: null,
    profileImageUrl: null,
    ...overrides,
  };
}

function createConfig(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function readS3Command(index = 0) {
  const command = mockS3Send.mock.calls[index]?.[0];
  if (!command || typeof command !== 'object') {
    throw new Error(`Missing S3 command at index ${index}.`);
  }
  return command as {
    constructor: { name: string };
    input: Record<string, unknown>;
  };
}

function firstMockArg<T>(mock: { mock: { calls: unknown[][] } }): T {
  return mock.mock.calls[0][0] as T;
}
