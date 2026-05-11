import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetPurpose, AssetStatus } from '@prisma/client';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AssetsService } from './assets.service';
import {
  COMPANY_BACKGROUND_MAX_BYTES,
  COMPANY_LOGO_MAX_BYTES,
} from './logo-asset.constants';

const mockS3Send = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  class MockS3Command {
    constructor(readonly input: unknown) {}
  }

  return {
    HeadObjectCommand: MockS3Command,
    PutObjectCommand: MockS3Command,
    S3Client: jest.fn(() => ({ send: mockS3Send })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (...args: unknown[]) =>
    (await mockGetSignedUrl(...args)) as string,
}));

describe('AssetsService', () => {
  const s3Env: Record<string, string | undefined> = {
    ASSET_STORAGE_DRIVER: 's3',
    AWS_REGION: 'ap-northeast-2',
    S3_ASSET_BUCKET: 'cpa-assets',
    S3_PUBLIC_BASE_URL: 'https://cpa-assets.s3.ap-northeast-2.amazonaws.com',
    S3_PRESIGN_EXPIRES_SECONDS: '300',
  };

  let prisma: {
    company: { findUnique: jest.Mock };
    asset: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: AssetsService;

  beforeEach(() => {
    prisma = {
      company: { findUnique: jest.fn() },
      asset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    mockS3Send.mockReset();
    mockGetSignedUrl
      .mockReset()
      .mockResolvedValue('https://signed.example.com');
    service = new AssetsService(
      prisma as unknown as PrismaService,
      createConfig(s3Env),
    );
  });

  it('rejects company logo upload URLs for users without a company', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(
      service.createCompanyLogoUploadUrl('user-1', {
        fileName: 'logo.png',
        contentType: 'image/png',
        byteSize: 100,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.asset.create).not.toHaveBeenCalled();
  });

  it('rejects invalid company logo content types and oversized files', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.createCompanyLogoUploadUrl('user-1', {
        fileName: 'logo.svg',
        contentType: 'image/svg+xml',
        byteSize: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createCompanyLogoUploadUrl('user-1', {
        fileName: 'logo.png',
        contentType: 'image/png',
        byteSize: COMPANY_LOGO_MAX_BYTES + 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.asset.create).not.toHaveBeenCalled();
  });

  it('creates a pending asset and returns a presigned upload URL', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    let capturedCreateArg: unknown;
    prisma.asset.create.mockImplementation((args: unknown) => {
      capturedCreateArg = args;
      return Promise.resolve({
        id: 'asset-1',
        publicUrl:
          'https://cpa-assets.s3.ap-northeast-2.amazonaws.com/company-logos/company-1/logo.png',
      });
    });

    const result = await service.createCompanyLogoUploadUrl('user-1', {
      fileName: ' logo.png ',
      contentType: 'image/png',
      byteSize: 123,
    });

    const createArg = capturedCreateArg as {
      data: Record<string, unknown>;
    };
    expect(createArg.data).toMatchObject({
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.PENDING,
      bucket: 'cpa-assets',
      region: 'ap-northeast-2',
      contentType: 'image/png',
      byteSize: 123,
      originalName: 'logo.png',
      uploadedById: 'user-1',
      companyId: 'company-1',
    });
    expect(mockGetSignedUrl).toHaveBeenCalled();
    expect(result).toMatchObject({
      assetId: 'asset-1',
      uploadUrl: 'https://signed.example.com',
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      requiresCredentials: false,
    });
  });

  it('creates company background upload URLs with background limits', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    let capturedCreateArg: unknown;
    prisma.asset.create.mockImplementation((args: unknown) => {
      capturedCreateArg = args;
      return Promise.resolve({
        id: 'asset-bg-1',
        publicUrl:
          'https://cpa-assets.s3.ap-northeast-2.amazonaws.com/company-backgrounds/company-1/background.jpg',
      });
    });

    const result = await service.createCompanyBackgroundUploadUrl('user-1', {
      fileName: ' background.jpg ',
      contentType: 'image/jpeg',
      byteSize: COMPANY_LOGO_MAX_BYTES + 100,
    });

    const createArg = capturedCreateArg as {
      data: Record<string, unknown>;
    };
    expect(createArg.data).toMatchObject({
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.PENDING,
      contentType: 'image/jpeg',
      byteSize: COMPANY_LOGO_MAX_BYTES + 100,
      originalName: 'background.jpg',
      uploadedById: 'user-1',
      companyId: 'company-1',
    });
    expect(createArg.data.key).toEqual(
      expect.stringContaining('company-backgrounds/company-1/'),
    );
    expect(mockGetSignedUrl).toHaveBeenCalled();
    expect(result).toMatchObject({
      assetId: 'asset-bg-1',
      uploadUrl: 'https://signed.example.com',
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      requiresCredentials: false,
    });
  });

  it('rejects invalid company background content types and oversized files', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.createCompanyBackgroundUploadUrl('user-1', {
        fileName: 'background.gif',
        contentType: 'image/gif',
        byteSize: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createCompanyBackgroundUploadUrl('user-1', {
        fileName: 'background.png',
        contentType: 'image/png',
        byteSize: COMPANY_BACKGROUND_MAX_BYTES + 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.asset.create).not.toHaveBeenCalled();
  });

  it('marks a pending asset ready after HeadObject verification', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1',
      status: AssetStatus.PENDING,
      bucket: 'cpa-assets',
      region: 'ap-northeast-2',
      key: 'company-logos/company-1/logo.png',
      contentType: 'image/png',
      byteSize: 123,
      publicUrl: 'https://assets.example.com/logo.png',
    });
    mockS3Send.mockResolvedValue({
      ContentLength: 123,
      ContentType: 'image/png',
    });
    let capturedUpdateArg: unknown;
    prisma.asset.update.mockImplementation((args: unknown) => {
      capturedUpdateArg = args;
      return Promise.resolve({
        id: 'asset-1',
        publicUrl: 'https://assets.example.com/logo.png',
      });
    });

    const result = await service.completeUpload('user-1', 'asset-1');

    const updateArg = capturedUpdateArg as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    };
    expect(updateArg.where).toEqual({ id: 'asset-1' });
    expect(updateArg.data).toMatchObject({
      status: AssetStatus.READY,
      byteSize: 123,
      contentType: 'image/png',
    });
    expect(result.asset).toEqual({
      id: 'asset-1',
      publicUrl: 'https://assets.example.com/logo.png',
    });
  });

  it('rejects completion when S3 object verification fails', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1',
      status: AssetStatus.PENDING,
      bucket: 'cpa-assets',
      region: 'ap-northeast-2',
      key: 'company-logos/company-1/logo.png',
      contentType: 'image/png',
      byteSize: 123,
      publicUrl: 'https://assets.example.com/logo.png',
    });
    mockS3Send.mockRejectedValue(new Error('missing'));

    await expect(
      service.completeUpload('user-1', 'asset-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.asset.update).not.toHaveBeenCalled();
  });

  it('creates local upload URLs without S3 configuration', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.asset.create.mockResolvedValue({
      id: 'asset-1',
      publicUrl:
        'http://localhost:3000/uploads/company-logos/company-1/logo.png',
    });
    service = new AssetsService(
      prisma as unknown as PrismaService,
      createConfig({
        ASSET_STORAGE_DRIVER: 'local',
        LOCAL_ASSET_DIR: join(tmpdir(), 'accountit-assets'),
        LOCAL_ASSET_PUBLIC_BASE_URL: 'http://localhost:3000/uploads',
        API_PUBLIC_BASE_URL: 'http://localhost:4000',
      }),
    );

    const result = await service.createCompanyLogoUploadUrl('user-1', {
      fileName: 'logo.png',
      contentType: 'image/png',
      byteSize: 123,
    });

    expect(mockGetSignedUrl).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      assetId: 'asset-1',
      uploadUrl: 'http://localhost:4000/assets/asset-1/local-upload',
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      requiresCredentials: true,
    });
  });

  it('writes local uploads and marks them ready after file verification', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'accountit-assets-'));
    service = new AssetsService(
      prisma as unknown as PrismaService,
      createConfig({
        ASSET_STORAGE_DRIVER: 'local',
        LOCAL_ASSET_DIR: tempDir,
        LOCAL_ASSET_PUBLIC_BASE_URL: 'http://localhost:3000/uploads',
        API_PUBLIC_BASE_URL: 'http://localhost:4000',
      }),
    );
    const body = Buffer.from('png-bytes');
    const asset = {
      id: 'asset-1',
      status: AssetStatus.PENDING,
      purpose: AssetPurpose.COMPANY_LOGO,
      bucket: 'local-assets',
      region: 'local',
      key: 'company-logos/company-1/logo.png',
      contentType: 'image/png',
      byteSize: body.length,
      publicUrl:
        'http://localhost:3000/uploads/company-logos/company-1/logo.png',
    };
    prisma.asset.findFirst.mockResolvedValue(asset);
    let capturedUpdateArg: unknown;
    prisma.asset.update.mockImplementation((args: unknown) => {
      capturedUpdateArg = args;
      return Promise.resolve({
        id: 'asset-1',
        publicUrl: asset.publicUrl,
      });
    });

    try {
      await expect(
        service.uploadLocalAsset('user-1', 'asset-1', body, 'image/png'),
      ).resolves.toEqual({ ok: true });
      await expect(
        readFile(join(tempDir, 'company-logos', 'company-1', 'logo.png')),
      ).resolves.toEqual(body);

      const result = await service.completeUpload('user-1', 'asset-1');

      expect(mockS3Send).not.toHaveBeenCalled();
      const updateArg = capturedUpdateArg as {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      };
      expect(updateArg.where).toEqual({ id: 'asset-1' });
      expect(updateArg.data).toMatchObject({
        status: AssetStatus.READY,
        byteSize: body.length,
        contentType: 'image/png',
      });
      expect(result.asset).toEqual({
        id: 'asset-1',
        publicUrl: asset.publicUrl,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('writes local company background uploads and verifies with background limits', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'accountit-assets-'));
    service = new AssetsService(
      prisma as unknown as PrismaService,
      createConfig({
        ASSET_STORAGE_DRIVER: 'local',
        LOCAL_ASSET_DIR: tempDir,
        LOCAL_ASSET_PUBLIC_BASE_URL: 'http://localhost:3000/uploads',
        API_PUBLIC_BASE_URL: 'http://localhost:4000',
      }),
    );
    const body = Buffer.alloc(COMPANY_LOGO_MAX_BYTES + 100, 1);
    const asset = {
      id: 'asset-bg-1',
      status: AssetStatus.PENDING,
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      bucket: 'local-assets',
      region: 'local',
      key: 'company-backgrounds/company-1/background.png',
      contentType: 'image/png',
      byteSize: body.length,
      publicUrl:
        'http://localhost:3000/uploads/company-backgrounds/company-1/background.png',
    };
    prisma.asset.findFirst.mockResolvedValue(asset);
    prisma.asset.update.mockResolvedValue({
      id: 'asset-bg-1',
      publicUrl: asset.publicUrl,
    });

    try {
      await expect(
        service.uploadLocalAsset('user-1', 'asset-bg-1', body, 'image/png'),
      ).resolves.toEqual({ ok: true });
      await expect(
        readFile(
          join(tempDir, 'company-backgrounds', 'company-1', 'background.png'),
        ),
      ).resolves.toEqual(body);

      const result = await service.completeUpload('user-1', 'asset-bg-1');

      expect(result.asset).toEqual({
        id: 'asset-bg-1',
        publicUrl: asset.publicUrl,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createConfig(env: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
}
