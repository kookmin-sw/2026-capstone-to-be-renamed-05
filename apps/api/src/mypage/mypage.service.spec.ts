/// <reference types="jest" />

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
  JobFamily,
  JobStatus,
  KicpaCondition,
  PersonalCareerStage,
  PersonalVerificationRequestStatus,
  UserRole,
  TraineeStatus,
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
import {
  JobFitAnalysisAiService,
  type GeneratedJobFitAnalysis,
  type GenerateJobFitAnalysisInput,
} from './job-fit-analysis-ai.service';
import { MypageService, RESUME_MAX_BYTES } from './mypage.service';

const mockResponsesCreate = jest.fn();
const mockS3Send = jest.fn((command: unknown): Promise<unknown> => {
  void command;
  return Promise.resolve(undefined);
});

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: mockResponsesCreate,
    },
  })),
}));

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

jest.mock('@cpa/shared', () => ({
  RESUME_ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx', 'txt', 'hwp', 'hwpx'],
  RESUME_ANALYSIS_FILE_EXTENSIONS: ['pdf', 'docx', 'txt'],
  RESUME_UPLOAD_LIMIT: 5,
  RESUME_UPLOAD_MAX_BYTES: 10 * 1024 * 1024,
}));

const createdAt = new Date('2026-05-10T00:00:00.000Z');

describe('JobFitAnalysisAiService file inputs', () => {
  beforeEach(() => {
    mockResponsesCreate.mockReset();
  });

  it('sends the resume as a Responses API input_file and parses JSON output', async () => {
    mockResponsesCreate.mockResolvedValue({
      id: 'resp-1',
      output_text: JSON.stringify({
        fitScore: 91,
        summary: 'Strong fit',
        strengths: ['Audit-ready resume'],
        companyPriorities: ['CPA readiness'],
        gaps: ['Clarify timeline'],
        recommendation: 'Tailor the opening summary.',
      }),
      usage: { total_tokens: 1234 },
    });
    const service = new JobFitAnalysisAiService(
      createConfig({ OPENAI_API_KEY: 'test-key' }),
    );

    const result = await service.generate({
      job: jobFitAiInput(),
      resume: {
        fileName: 'audit-resume.txt',
        contentType: 'text/plain',
        byteSize: 11,
        fileBase64: Buffer.from('resume-body').toString('base64'),
      },
    });

    expect(result.fitScore).toBe(91);
    expect(result.rawJson).toMatchObject({
      provider: 'openai',
      api: 'responses',
      responseId: 'resp-1',
    });
    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.5',
        reasoning: { effort: 'low' },
        store: false,
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: 'json_schema',
            name: 'job_fit_analysis',
          }),
        }),
        input: [
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'input_file',
                filename: 'audit-resume.txt',
                file_data: `data:text/plain;base64,${Buffer.from(
                  'resume-body',
                ).toString('base64')}`,
              }),
            ]),
          }),
        ],
      }),
    );
  });

  it('maps OpenAI file input rejection to a bad request', async () => {
    mockResponsesCreate.mockRejectedValue({ status: 400 });
    const service = new JobFitAnalysisAiService(
      createConfig({ OPENAI_API_KEY: 'test-key' }),
    );

    await expect(
      service.generate({
        job: jobFitAiInput(),
        resume: {
          fileName: 'resume.hwp',
          contentType: 'application/x-hwp',
          byteSize: 8,
          fileBase64: Buffer.from('hwp-body').toString('base64'),
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MypageService resumes', () => {
  let tempDir: string;
  let prisma: {
    resume: {
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
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
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((callback: (client: typeof prisma) => unknown) =>
        callback(prisma),
      ),
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

  it('accepts all supported resume upload formats', async () => {
    prisma.resume.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          createdAt,
          updatedAt: createdAt,
        }),
    );

    const pdf = await service.createResume('user-1', {
      fileName: 'audit-resume.pdf',
      contentType: 'application/pdf',
      body: Buffer.from('%PDF'),
    });
    const doc = await service.createResume('user-1', {
      fileName: 'legacy-resume.doc',
      contentType: 'application/msword',
      body: Buffer.from('doc-bytes'),
    });
    const txt = await service.createResume('user-1', {
      fileName: 'audit-resume.txt',
      contentType: 'text/plain; charset=utf-8',
      body: Buffer.from('감사 수습 이력서 본문', 'utf8'),
    });
    const docx = await service.createResume('user-1', {
      fileName: 'tax-resume.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: Buffer.from('docx-bytes'),
    });
    const hwp = await service.createResume('user-1', {
      fileName: 'korean-resume.hwp',
      contentType: 'application/x-hwp',
      body: Buffer.from('hwp-bytes'),
    });
    const hwpx = await service.createResume('user-1', {
      fileName: 'korean-resume.hwpx',
      contentType: 'application/vnd.hancom.hwpx',
      body: Buffer.from('hwpx-bytes'),
    });

    expect(pdf.contentType).toBe('application/pdf');
    expect(doc.contentType).toBe('application/msword');
    expect(txt.contentType).toBe('text/plain');
    expect(docx.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(hwp.contentType).toBe('application/x-hwp');
    expect(hwpx.contentType).toBe('application/vnd.hancom.hwpx');
    await expect(
      readFile(join(tempDir, 'user-1', `${txt.id}.txt`), 'utf8'),
    ).resolves.toBe('감사 수습 이력서 본문');
    await expect(
      readFile(join(tempDir, 'user-1', `${docx.id}.docx`), 'utf8'),
    ).resolves.toBe('docx-bytes');
    await expect(
      readFile(join(tempDir, 'user-1', `${hwp.id}.hwp`), 'utf8'),
    ).resolves.toBe('hwp-bytes');
    await expect(
      readFile(join(tempDir, 'user-1', `${hwpx.id}.hwpx`), 'utf8'),
    ).resolves.toBe('hwpx-bytes');
  });

  it('rejects unsupported resume files before creating records', async () => {
    const rejectedPayloads = [
      {
        fileName: 'malware.exe',
        contentType: 'application/octet-stream',
        body: Buffer.from('nope'),
      },
      {
        fileName: 'empty.txt',
        contentType: 'text/plain',
        body: Buffer.alloc(0),
      },
      {
        fileName: 'large.pdf',
        contentType: 'application/pdf',
        body: Buffer.alloc(RESUME_MAX_BYTES + 1),
      },
    ];

    for (const payload of rejectedPayloads) {
      await expect(
        service.createResume('user-1', payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    }

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

  it('defaults to S3 resume storage when the configured runtime is aws', async () => {
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
        APP_ENV: 'aws',
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
    const command = readS3Command();
    expect(command.constructor.name).toBe('PutObjectCommand');
    expect(command.input).toMatchObject({
      Bucket: 'private-resumes',
      ContentType: 'application/pdf',
    });
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

  it('marks a selected resume as the users primary resume', async () => {
    const resume = resumeRecord({ id: 'resume-2', userId: 'user-1' });
    prisma.resume.findFirst.mockResolvedValue(resume);
    prisma.resume.update.mockResolvedValue({ ...resume, isPrimary: true });

    const result = await service.setPrimaryResume('user-1', 'resume-2');

    expect(result).toMatchObject({ id: 'resume-2', isPrimary: true });
    expect(prisma.resume.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isPrimary: true },
      data: { isPrimary: false },
    });
    expect(prisma.resume.update).toHaveBeenCalledWith({
      where: { id: 'resume-2' },
      data: { isPrimary: true },
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

describe('MypageService job fit analyses', () => {
  let prisma: {
    jobFitAnalysis: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    resume: {
      findFirst: jest.Mock;
    };
    job: {
      findFirst: jest.Mock;
    };
  };
  let tempDir: string;
  let service: MypageService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'accountit-analysis-'));
    prisma = {
      jobFitAnalysis: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      resume: {
        findFirst: jest.fn(),
      },
      job: {
        findFirst: jest.fn(),
      },
    };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('rejects analyses with resumes owned by another user', async () => {
    prisma.resume.findFirst.mockResolvedValue(null);
    prisma.job.findFirst.mockResolvedValue(jobRecord());

    await expect(
      service.createJobFitAnalysis('user-1', {
        jobId: 'job-1',
        resumeId: 'resume-other',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.resume.findFirst).toHaveBeenCalledWith({
      where: { id: 'resume-other', userId: 'user-1' },
      select: {
        id: true,
        userId: true,
        fileName: true,
        contentType: true,
        byteSize: true,
      },
    });
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects analyses for missing or closed jobs', async () => {
    prisma.resume.findFirst.mockResolvedValue(resumeRecord());
    prisma.job.findFirst.mockResolvedValue(null);

    await expect(
      service.createJobFitAnalysis('user-1', {
        jobId: 'closed-job',
        resumeId: 'resume-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    const jobFindArg = firstMockArg<{
      where: { id: string; status: JobStatus };
      include: unknown;
    }>(prisma.job.findFirst);
    expect(jobFindArg.where).toEqual({
      id: 'closed-job',
      status: JobStatus.OPEN,
    });
    expect(jobFindArg.include).toBeDefined();
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('creates a new OpenAI-backed analysis when no exact analysis exists', async () => {
    const generatedAnalysis: GeneratedJobFitAnalysis = {
      fitScore: 92,
      summary: 'Strong match',
      strengths: ['Audit fit'],
      companyPriorities: ['KICPA readiness'],
      gaps: ['Add quantified outcomes'],
      recommendation: 'Tailor the first page.',
      rawJson: { provider: 'openai' },
    };
    const generateMock = jest.fn() as jest.Mock<
      Promise<GeneratedJobFitAnalysis>,
      [GenerateJobFitAnalysisInput]
    >;
    generateMock.mockResolvedValue(generatedAnalysis);
    const aiService = { generate: generateMock };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
      undefined,
      aiService as unknown as JobFitAnalysisAiService,
    );
    const resumeText =
      '감사 수습 지원자 이력서입니다. 회계감사 인턴으로 매출채권 확인, 비용 분석, 감사조서 정리를 수행했고 KICPA 1차 합격 후 2차 시험을 준비하고 있습니다.';
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(join(tempDir, 'user-1', 'resume-1.txt'), resumeText);
    prisma.resume.findFirst.mockResolvedValue(
      resumeRecord({
        fileName: 'audit-resume.txt',
        contentType: 'text/plain',
        byteSize: Buffer.byteLength(resumeText),
      }),
    );
    prisma.job.findFirst.mockResolvedValue(jobRecord());
    prisma.jobFitAnalysis.create.mockResolvedValue(
      jobFitAnalysisRecord({ id: 'analysis-created', fitScore: 92 }),
    );

    const result = await service.createJobFitAnalysis('user-1', {
      jobId: 'job-1',
      resumeId: 'resume-1',
    });

    expect(result.reused).toBe(false);
    expect(result.item.id).toBe('analysis-created');
    const aiInput = aiService.generate.mock.calls[0]?.[0];
    expect(aiInput?.job.title).toBe('Audit associate');
    expect(aiInput?.job.company.name).toBe('Hanbit');
    expect(aiInput?.resume.fileName).toBe('audit-resume.txt');
    expect(aiInput?.resume.contentType).toBe('text/plain');
    expect(aiInput?.resume.fileBase64).toBe(
      Buffer.from(resumeText).toString('base64'),
    );

    const createArg = firstMockArg<{
      data: Record<string, unknown>;
      include: unknown;
    }>(prisma.jobFitAnalysis.create);
    expect(createArg.data).toMatchObject({
      userId: 'user-1',
      jobId: 'job-1',
      resumeId: 'resume-1',
      fitScore: 92,
      rawJson: { provider: 'openai' },
    });
    expect(createArg.include).toBeDefined();
  });

  it('updates an existing analysis when refresh is requested', async () => {
    const generatedAnalysis: GeneratedJobFitAnalysis = {
      fitScore: 95,
      summary: 'Refreshed match',
      strengths: ['Updated audit fit'],
      companyPriorities: ['Immediate readiness'],
      gaps: ['Clarify CPA timeline'],
      recommendation: 'Refresh the summary for this posting.',
      rawJson: { provider: 'openai', refreshed: true },
    };
    const generateMock = jest.fn() as jest.Mock<
      Promise<GeneratedJobFitAnalysis>,
      [GenerateJobFitAnalysisInput]
    >;
    generateMock.mockResolvedValue(generatedAnalysis);
    const aiService = { generate: generateMock };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
      undefined,
      aiService as unknown as JobFitAnalysisAiService,
    );
    const resumeText =
      '세무 주니어 이력서입니다. 원천세, 부가가치세 신고 보조, 법인세 세무조정 자료 취합, ERP 전표 검토 경험이 있으며 세무법인 주니어 포지션을 희망합니다.';
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(join(tempDir, 'user-1', 'resume-1.txt'), resumeText);
    prisma.jobFitAnalysis.findUnique.mockResolvedValue(
      jobFitAnalysisRecord({ id: 'analysis-1', fitScore: 70 }),
    );
    prisma.resume.findFirst.mockResolvedValue(
      resumeRecord({
        fileName: 'tax-resume.txt',
        contentType: 'text/plain',
        byteSize: Buffer.byteLength(resumeText),
      }),
    );
    prisma.job.findFirst.mockResolvedValue(jobRecord());
    prisma.jobFitAnalysis.update.mockResolvedValue(
      jobFitAnalysisRecord({
        id: 'analysis-1',
        fitScore: 95,
        summary: 'Refreshed match',
      }),
    );

    const result = await service.createJobFitAnalysis('user-1', {
      jobId: 'job-1',
      resumeId: 'resume-1',
      refresh: true,
    });

    expect(result.reused).toBe(false);
    expect(result.item.fitScore).toBe(95);
    expect(aiService.generate).toHaveBeenCalledTimes(1);
    expect(prisma.jobFitAnalysis.update).toHaveBeenCalledWith({
      where: { id: 'analysis-1' },
      data: expect.objectContaining({
        fitScore: 95,
        rawJson: { provider: 'openai', refreshed: true },
      }),
      include: expect.any(Object),
    });
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('passes OpenAI file recognition failures through as user input errors', async () => {
    const generateMock = jest.fn() as jest.Mock<
      Promise<GeneratedJobFitAnalysis>,
      [GenerateJobFitAnalysisInput]
    >;
    generateMock.mockRejectedValue(
      new BadRequestException(
        '이력서 파일을 OpenAI가 읽지 못했습니다. PDF, DOCX, TXT 등으로 변환해 다시 업로드해 주세요.',
      ),
    );
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
      undefined,
      { generate: generateMock } as unknown as JobFitAnalysisAiService,
    );
    const resumeText =
      'Even when OpenAI cannot read the uploaded PDF, the original bytes are sent as an input_file.';
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(join(tempDir, 'user-1', 'resume-1.pdf'), resumeText);
    prisma.resume.findFirst.mockResolvedValue(
      resumeRecord({
        fileName: 'unsupported-openai-resume.pdf',
        contentType: 'application/pdf',
        byteSize: Buffer.byteLength(resumeText),
      }),
    );
    prisma.job.findFirst.mockResolvedValue(jobRecord());

    await expect(
      service.createJobFitAnalysis('user-1', {
        jobId: 'job-1',
        resumeId: 'resume-1',
        refresh: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resume: expect.objectContaining({
          fileBase64: Buffer.from(resumeText).toString('base64'),
        }),
      }),
    );
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects HWP analysis before calling OpenAI file input', async () => {
    const generateMock = jest.fn() as jest.Mock<
      Promise<GeneratedJobFitAnalysis>,
      [GenerateJobFitAnalysisInput]
    >;
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
      undefined,
      { generate: generateMock } as unknown as JobFitAnalysisAiService,
    );
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(join(tempDir, 'user-1', 'resume-1.hwp'), 'hwp body');
    prisma.resume.findFirst.mockResolvedValue(
      resumeRecord({
        fileName: 'korean-resume.hwp',
        contentType: 'application/x-hwp',
        byteSize: Buffer.byteLength('hwp body'),
      }),
    );
    prisma.job.findFirst.mockResolvedValue(jobRecord());

    await expect(
      service.createJobFitAnalysis('user-1', {
        jobId: 'job-1',
        resumeId: 'resume-1',
        refresh: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(generateMock).not.toHaveBeenCalled();
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects DOC analysis before calling OpenAI file input', async () => {
    const generateMock = jest.fn() as jest.Mock<
      Promise<GeneratedJobFitAnalysis>,
      [GenerateJobFitAnalysisInput]
    >;
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
      { deleteAsset: jest.fn() } as unknown as AssetsService,
      undefined,
      { generate: generateMock } as unknown as JobFitAnalysisAiService,
    );
    await mkdir(join(tempDir, 'user-1'), { recursive: true });
    await writeFile(join(tempDir, 'user-1', 'resume-1.doc'), 'doc body');
    prisma.resume.findFirst.mockResolvedValue(
      resumeRecord({
        fileName: 'legacy-resume.doc',
        contentType: 'application/msword',
        byteSize: Buffer.byteLength('doc body'),
      }),
    );
    prisma.job.findFirst.mockResolvedValue(jobRecord());

    await expect(
      service.createJobFitAnalysis('user-1', {
        jobId: 'job-1',
        resumeId: 'resume-1',
        refresh: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(generateMock).not.toHaveBeenCalled();
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
  });

  it('reuses an existing analysis for the same user, job, and resume', async () => {
    prisma.jobFitAnalysis.findUnique.mockResolvedValue(
      jobFitAnalysisRecord({ fitScore: 88 }),
    );

    const result = await service.createJobFitAnalysis('user-1', {
      jobId: 'job-1',
      resumeId: 'resume-1',
    });

    expect(result.reused).toBe(true);
    expect(result.item.fitScore).toBe(88);
    const findUniqueArg = firstMockArg<{
      where: {
        userId_jobId_resumeId: {
          userId: string;
          jobId: string;
          resumeId: string;
        };
      };
      include: unknown;
    }>(prisma.jobFitAnalysis.findUnique);
    expect(findUniqueArg.where).toEqual({
      userId_jobId_resumeId: {
        userId: 'user-1',
        jobId: 'job-1',
        resumeId: 'resume-1',
      },
    });
    expect(findUniqueArg.include).toBeDefined();
    expect(prisma.jobFitAnalysis.create).not.toHaveBeenCalled();
    expect(prisma.jobFitAnalysis.update).not.toHaveBeenCalled();
  });

  it('lists only real high-fit analyses for mypage recommendations', async () => {
    prisma.jobFitAnalysis.findMany.mockResolvedValue([
      jobFitAnalysisRecord({
        id: 'analysis-mock',
        fitScore: 96,
        rawJson: { source: 'prisma/mock.ts', version: 'mock-seed-v1' },
      }),
      jobFitAnalysisRecord({ id: 'analysis-1', fitScore: 91 }),
      jobFitAnalysisRecord({ id: 'analysis-2', fitScore: 78 }),
    ]);

    const result = await service.listHighFitJobAnalyses('user-1', 5);

    const findManyArg = firstMockArg<{
      where: { userId: string; fitScore: { gte: number } };
      include: unknown;
      orderBy: Array<Record<string, string>>;
      take: number;
    }>(prisma.jobFitAnalysis.findMany);
    expect(findManyArg).toMatchObject({
      where: {
        userId: 'user-1',
        fitScore: { gte: 75 },
      },
      orderBy: [{ fitScore: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });
    expect(findManyArg.include).toBeDefined();
    expect(result.items.map((item) => item.fitScore)).toEqual([91, 78]);
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
    isPrimary: false,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function jobFitAiInput(): GenerateJobFitAnalysisInput['job'] {
  return {
    title: 'Audit associate',
    description: 'Audit work',
    jobFamily: 'AUDIT',
    employmentType: 'FULL_TIME',
    companyType: 'LOCAL_ACCOUNTING_FIRM',
    kicpaCondition: 'PREFERRED',
    traineeStatus: 'AVAILABLE',
    practicalTrainingInstitution: true,
    minExperienceYears: 0,
    maxExperienceYears: 1,
    location: 'Seoul',
    deadlineType: 'FIXED_DATE',
    deadline: '2026-05-31T14:59:59.000Z',
    labels: ['audit'],
    company: {
      name: 'Hanbit',
      type: 'LOCAL_ACCOUNTING_FIRM',
      tags: ['audit'],
      description: 'Local accounting firm',
    },
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

function jobRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    title: 'Audit associate',
    description: 'Audit work',
    jobFamily: JobFamily.AUDIT,
    companyType: 'LOCAL_ACCOUNTING_FIRM',
    employmentType: 'FULL_TIME',
    kicpaCondition: KicpaCondition.PREFERRED,
    traineeStatus: TraineeStatus.AVAILABLE,
    practicalTrainingInstitution: true,
    minExperienceYears: 0,
    maxExperienceYears: 1,
    location: 'Seoul',
    deadlineType: 'FIXED_DATE',
    company: {
      name: 'Hanbit',
      type: 'LOCAL_ACCOUNTING_FIRM',
      tags: ['audit'],
      description: 'Local accounting firm',
    },
    labels: [],
    ...overrides,
  };
}

function jobFitAnalysisRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'analysis-1',
    userId: 'user-1',
    jobId: 'job-1',
    resumeId: 'resume-1',
    fitScore: 82,
    summary: 'Good fit',
    strengths: ['Audit experience'],
    companyPriorities: ['Audit readiness'],
    gaps: ['Clarify projects'],
    recommendation: 'Apply with a tailored summary.',
    rawJson: {},
    createdAt,
    updatedAt: createdAt,
    job: {
      id: 'job-1',
      title: 'Audit associate',
      companyId: 'company-1',
      company: { name: 'Hanbit' },
    },
    resume: {
      id: 'resume-1',
      fileName: 'audit-resume.pdf',
    },
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
