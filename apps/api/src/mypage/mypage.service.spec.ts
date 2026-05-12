import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CpaVerificationStatus,
  CommunityBoardType,
  EmploymentHistoryStatus,
  PersonalCareerStage,
  PersonalVerificationRequestStatus,
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
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({ LOCAL_RESUME_DIR: tempDir }),
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
        findMany: jest.fn(),
      },
    };
    service = new MypageService(
      prisma as unknown as PrismaService,
      createConfig({}),
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
      take: 5,
    });
    expect(result.items).toEqual([
      {
        id: 'post-1',
        boardType: CommunityBoardType.FREE,
        title: '회계법인 면접 후기 공유합니다',
        commentCount: 12,
        likeCount: 8,
        createdAt: createdAt.toISOString(),
      },
    ]);
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
