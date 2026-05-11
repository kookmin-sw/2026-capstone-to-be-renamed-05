import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
