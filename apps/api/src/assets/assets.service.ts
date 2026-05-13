import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetPurpose, AssetStatus, type Asset } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  resolveRuntimeEnvironment,
  resolveWorkspaceRoot,
} from '../config/runtime-environment';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyBackgroundUploadUrlDto } from './dto/create-company-background-upload-url.dto';
import { CreateCompanyLogoUploadUrlDto } from './dto/create-company-logo-upload-url.dto';
import { CreateProfileImageUploadUrlDto } from './dto/create-profile-image-upload-url.dto';
import {
  COMPANY_BACKGROUND_EXTENSIONS,
  COMPANY_BACKGROUND_MAX_BYTES,
  COMPANY_LOGO_EXTENSIONS,
  COMPANY_LOGO_MAX_BYTES,
  PROFILE_IMAGE_EXTENSIONS,
  PROFILE_IMAGE_MAX_BYTES,
} from './logo-asset.constants';

const DEFAULT_PRESIGN_EXPIRES_SECONDS = 300;
const LOCAL_ASSET_BUCKET = 'local-assets';
const LOCAL_ASSET_REGION = 'local';

type AssetStorageConfig =
  | {
      driver: 's3';
      bucket: string;
      region: string;
      publicBaseUrl: string;
      expiresIn: number;
    }
  | {
      driver: 'local';
      bucket: typeof LOCAL_ASSET_BUCKET;
      region: typeof LOCAL_ASSET_REGION;
      publicBaseUrl: string;
      rootDir: string;
      uploadBaseUrl: string;
      expiresIn: number;
    };

@Injectable()
export class AssetsService implements OnModuleInit {
  private readonly s3Clients = new Map<string, S3Client>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.getAssetStorageDriver() === 's3') {
      this.getS3Config();
    }
  }

  async createCompanyLogoUploadUrl(
    userId: string,
    dto: CreateCompanyLogoUploadUrlDto,
  ) {
    return this.createImageUploadUrl(userId, dto, AssetPurpose.COMPANY_LOGO);
  }

  async createCompanyBackgroundUploadUrl(
    userId: string,
    dto: CreateCompanyBackgroundUploadUrlDto,
  ) {
    return this.createImageUploadUrl(
      userId,
      dto,
      AssetPurpose.COMPANY_BACKGROUND,
    );
  }

  async createProfileImageUploadUrl(
    userId: string,
    dto: CreateProfileImageUploadUrlDto,
  ) {
    return this.createImageUploadUrl(
      userId,
      dto,
      AssetPurpose.USER_PROFILE_IMAGE,
    );
  }

  private async createImageUploadUrl(
    userId: string,
    dto:
      | CreateCompanyLogoUploadUrlDto
      | CreateCompanyBackgroundUploadUrlDto
      | CreateProfileImageUploadUrlDto,
    purpose: AssetPurpose,
  ) {
    const company = this.isCompanyImagePurpose(purpose)
      ? await this.getOwnedCompanyOrThrow(userId)
      : null;
    const storageConfig = this.getAssetStorageConfig();
    const config = this.getImagePurposeConfig(purpose);
    const extension = config.extensions.get(dto.contentType);

    if (!extension) {
      throw new BadRequestException(config.invalidTypeMessage);
    }
    if (dto.byteSize > config.maxBytes) {
      throw new BadRequestException(config.oversizeMessage);
    }

    const key = [
      config.keyPrefix,
      company?.id ?? userId,
      `${Date.now()}-${randomUUID()}.${extension}`,
    ].join('/');
    const publicUrl = this.buildPublicUrl(storageConfig.publicBaseUrl, key);
    const asset = await this.prisma.asset.create({
      data: {
        purpose,
        status: AssetStatus.PENDING,
        bucket: storageConfig.bucket,
        region: storageConfig.region,
        key,
        publicUrl,
        contentType: dto.contentType,
        byteSize: dto.byteSize,
        originalName: this.normalizeOriginalName(dto.fileName),
        uploadedById: userId,
        companyId: company?.id ?? null,
      },
    });

    if (storageConfig.driver === 'local') {
      return {
        assetId: asset.id,
        uploadUrl: this.buildLocalUploadUrl(
          storageConfig.uploadBaseUrl,
          asset.id,
        ),
        method: 'PUT' as const,
        headers: { 'Content-Type': dto.contentType },
        publicUrl,
        expiresIn: storageConfig.expiresIn,
        requiresCredentials: true,
      };
    }

    const uploadUrl = await getSignedUrl(
      this.getS3Client(storageConfig.region),
      new PutObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
        ContentType: dto.contentType,
      }),
      { expiresIn: storageConfig.expiresIn },
    );

    return {
      assetId: asset.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.contentType },
      publicUrl,
      expiresIn: storageConfig.expiresIn,
      requiresCredentials: false,
    };
  }

  async uploadLocalAsset(
    userId: string,
    assetId: string,
    body: Buffer,
    contentTypeHeader: string | string[] | undefined,
  ) {
    if (this.getAssetStorageDriver() !== 'local') {
      throw new BadRequestException('Local file uploads are not enabled.');
    }

    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        uploadedById: userId,
        purpose: {
          in: this.uploadableImagePurposes(),
        },
        status: AssetStatus.PENDING,
      },
    });

    if (!asset) {
      throw new NotFoundException('Upload asset was not found.');
    }
    if (!this.isLocalAsset(asset)) {
      throw new BadRequestException(
        'This asset was not created for local upload.',
      );
    }

    const contentType = this.parseContentTypeHeader(contentTypeHeader);
    if (contentType !== asset.contentType) {
      throw new BadRequestException(
        'Uploaded image content type does not match the request.',
      );
    }
    this.assertLocalUploadBody(asset, body);

    const localConfig = this.getLocalConfig();
    const targetPath = this.resolveLocalAssetPath(
      localConfig.rootDir,
      asset.key,
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, body);

    return { ok: true };
  }

  async completeUpload(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        uploadedById: userId,
        purpose: {
          in: this.uploadableImagePurposes(),
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('업로드 자산을 찾을 수 없습니다.');
    }
    if (asset.status === AssetStatus.READY) {
      return { asset: this.toAssetResponse(asset) };
    }

    const head = this.isLocalAsset(asset)
      ? await this.headLocalObject(asset)
      : await this.headObject(asset.bucket, asset.region, asset.key);
    this.assertUploadedObjectMatches(asset, head);

    const updated = await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: AssetStatus.READY,
        byteSize: head.ContentLength ?? asset.byteSize,
        contentType: head.ContentType ?? asset.contentType,
        completedAt: new Date(),
      },
    });

    return { asset: this.toAssetResponse(updated) };
  }

  async deleteAsset(
    userId: string,
    assetId: string,
    allowedPurposes: AssetPurpose[],
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        uploadedById: userId,
        purpose: { in: allowedPurposes },
      },
    });

    if (!asset) return { ok: false };

    await this.deleteStoredObject(asset);
    await this.prisma.asset.delete({ where: { id: asset.id } });
    return { ok: true };
  }

  private async headLocalObject(asset: Pick<Asset, 'contentType' | 'key'>) {
    const localConfig = this.getLocalConfig();
    const targetPath = this.resolveLocalAssetPath(
      localConfig.rootDir,
      asset.key,
    );

    try {
      const file = await stat(targetPath);
      return {
        ContentLength: file.size,
        ContentType: asset.contentType,
      };
    } catch {
      throw new BadRequestException(
        'Local upload was not found. Upload the file and try again.',
      );
    }
  }

  private async headObject(bucket: string, region: string, key: string) {
    try {
      return await this.getS3Client(region).send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
    } catch {
      throw new BadRequestException(
        'S3 업로드가 확인되지 않았습니다. 파일 업로드 후 다시 시도해 주세요.',
      );
    }
  }

  private assertUploadedObjectMatches(
    asset: { byteSize: number; contentType: string; purpose: AssetPurpose },
    head: Pick<HeadObjectCommandOutput, 'ContentLength' | 'ContentType'>,
  ) {
    const config = this.getImagePurposeConfig(asset.purpose);
    if (!head.ContentLength || head.ContentLength <= 0) {
      throw new BadRequestException(
        '업로드된 이미지 크기를 확인할 수 없습니다.',
      );
    }
    if (head.ContentLength > config.maxBytes) {
      throw new BadRequestException(config.oversizeMessage);
    }
    if (head.ContentLength !== asset.byteSize) {
      throw new BadRequestException('업로드된 이미지 크기가 요청과 다릅니다.');
    }
    if (head.ContentType !== asset.contentType) {
      throw new BadRequestException('업로드된 이미지 형식이 요청과 다릅니다.');
    }
  }

  private assertLocalUploadBody(
    asset: Pick<Asset, 'byteSize' | 'purpose'>,
    body: Buffer,
  ) {
    const config = this.getImagePurposeConfig(asset.purpose);
    if (body.length <= 0) {
      throw new BadRequestException('Uploaded image file is empty.');
    }
    if (body.length > config.maxBytes) {
      throw new BadRequestException(config.oversizeMessage);
    }
    if (body.length !== asset.byteSize) {
      throw new BadRequestException(
        'Uploaded image size does not match the request.',
      );
    }
  }

  private async deleteStoredObject(
    asset: Pick<Asset, 'bucket' | 'region' | 'key'>,
  ) {
    if (this.isLocalAsset(asset)) {
      const localConfig = this.getLocalConfig();
      await rm(this.resolveLocalAssetPath(localConfig.rootDir, asset.key), {
        force: true,
      });
      return;
    }

    await this.getS3Client(asset.region).send(
      new DeleteObjectCommand({ Bucket: asset.bucket, Key: asset.key }),
    );
  }

  private getImagePurposeConfig(purpose: AssetPurpose): {
    keyPrefix: string;
    extensions: Map<string, string>;
    maxBytes: number;
    invalidTypeMessage: string;
    oversizeMessage: string;
  } {
    if (purpose === AssetPurpose.COMPANY_BACKGROUND) {
      return {
        keyPrefix: 'company-backgrounds',
        extensions: COMPANY_BACKGROUND_EXTENSIONS,
        maxBytes: COMPANY_BACKGROUND_MAX_BYTES,
        invalidTypeMessage:
          '기업 배경 이미지는 PNG, JPG, WEBP 파일만 업로드할 수 있습니다.',
        oversizeMessage: '기업 배경 이미지는 5MB 이하로 업로드해 주세요.',
      };
    }

    if (purpose === AssetPurpose.USER_PROFILE_IMAGE) {
      return {
        keyPrefix: 'profile-images',
        extensions: PROFILE_IMAGE_EXTENSIONS,
        maxBytes: PROFILE_IMAGE_MAX_BYTES,
        invalidTypeMessage:
          '프로필 사진은 PNG, JPG, WEBP 파일만 업로드할 수 있습니다.',
        oversizeMessage: '프로필 사진은 2MB 이하로 업로드해 주세요.',
      };
    }

    return {
      keyPrefix: 'company-logos',
      extensions: COMPANY_LOGO_EXTENSIONS,
      maxBytes: COMPANY_LOGO_MAX_BYTES,
      invalidTypeMessage:
        '기업 이미지는 PNG, JPG, WEBP, GIF 파일만 업로드할 수 있습니다.',
      oversizeMessage: '기업 이미지는 2MB 이하로 업로드해 주세요.',
    };
  }

  private uploadableImagePurposes() {
    return [
      AssetPurpose.COMPANY_LOGO,
      AssetPurpose.COMPANY_BACKGROUND,
      AssetPurpose.USER_PROFILE_IMAGE,
    ];
  }

  private isCompanyImagePurpose(purpose: AssetPurpose) {
    return (
      purpose === AssetPurpose.COMPANY_LOGO ||
      purpose === AssetPurpose.COMPANY_BACKGROUND
    );
  }

  private async getOwnedCompanyOrThrow(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    if (!company) {
      throw new ForbiddenException('기업회원 회사 정보를 찾을 수 없습니다.');
    }
    return company;
  }

  private getS3Config(): Extract<AssetStorageConfig, { driver: 's3' }> {
    const region = this.config.get<string>('AWS_REGION')?.trim();
    const bucket = this.config.get<string>('S3_ASSET_BUCKET')?.trim();
    const publicBaseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL')?.trim();
    const expiresIn = this.parseExpiresIn(
      this.config.get<string>('S3_PRESIGN_EXPIRES_SECONDS'),
    );

    if (!region || !bucket || !publicBaseUrl) {
      throw new InternalServerErrorException(
        'S3 업로드 환경 변수가 설정되지 않았습니다.',
      );
    }

    return { driver: 's3' as const, region, bucket, publicBaseUrl, expiresIn };
  }

  private getLocalConfig(): Extract<AssetStorageConfig, { driver: 'local' }> {
    const workspaceRoot = resolveWorkspaceRoot();
    const rootDir =
      this.resolveWorkspacePath(
        this.config.get<string>('LOCAL_ASSET_DIR')?.trim(),
        workspaceRoot,
      ) ?? join(workspaceRoot, 'apps', 'web', 'public', 'uploads');
    const publicBaseUrl =
      this.config.get<string>('LOCAL_ASSET_PUBLIC_BASE_URL')?.trim() ??
      'http://localhost:3000/uploads';
    const port = this.config.get<string>('PORT')?.trim() || '4000';
    const uploadBaseUrl =
      this.getConfiguredHttpUrl(
        'LOCAL_API_PUBLIC_BASE_URL',
        'API_PUBLIC_BASE_URL',
        'NEXT_PUBLIC_API_BASE_URL',
      ) ?? `http://localhost:${port}`;
    const expiresIn = this.parseExpiresIn(
      this.config.get<string>('LOCAL_UPLOAD_EXPIRES_SECONDS') ??
        this.config.get<string>('S3_PRESIGN_EXPIRES_SECONDS'),
    );

    return {
      driver: 'local' as const,
      bucket: LOCAL_ASSET_BUCKET,
      region: LOCAL_ASSET_REGION,
      publicBaseUrl,
      rootDir,
      uploadBaseUrl,
      expiresIn,
    };
  }

  private getAssetStorageConfig(): AssetStorageConfig {
    return this.getAssetStorageDriver() === 's3'
      ? this.getS3Config()
      : this.getLocalConfig();
  }

  private getAssetStorageDriver() {
    const configured = this.config
      .get<string>('ASSET_STORAGE_DRIVER')
      ?.trim()
      .toLowerCase();

    if (configured === 's3' || configured === 'local') return configured;
    if (configured) {
      throw new InternalServerErrorException(
        'ASSET_STORAGE_DRIVER must be set to local or s3.',
      );
    }

    return resolveRuntimeEnvironment() === 'aws' ? 's3' : 'local';
  }

  private getS3Client(region: string) {
    const existing = this.s3Clients.get(region);
    if (existing) return existing;

    const client = new S3Client({ region });
    this.s3Clients.set(region, client);
    return client;
  }

  private parseExpiresIn(value: string | undefined) {
    const parsed = Number(value ?? DEFAULT_PRESIGN_EXPIRES_SECONDS);
    if (!Number.isFinite(parsed)) return DEFAULT_PRESIGN_EXPIRES_SECONDS;
    return Math.min(Math.max(Math.floor(parsed), 60), 900);
  }

  private buildPublicUrl(publicBaseUrl: string, key: string) {
    const base = publicBaseUrl.replace(/\/+$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${base}/${encodedKey}`;
  }

  private buildLocalUploadUrl(uploadBaseUrl: string, assetId: string) {
    return this.joinUrl(
      uploadBaseUrl,
      `assets/${encodeURIComponent(assetId)}/local-upload`,
    );
  }

  private joinUrl(baseUrl: string, path: string) {
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private resolveLocalAssetPath(rootDir: string, key: string) {
    const rootPath = resolve(rootDir);
    const targetPath = resolve(rootPath, ...key.split('/'));
    if (
      targetPath !== rootPath &&
      !targetPath.startsWith(`${rootPath}${sep}`)
    ) {
      throw new InternalServerErrorException(
        'Local asset path is outside the allowed upload directory.',
      );
    }
    return targetPath;
  }

  private resolveWorkspacePath(
    configuredPath: string | undefined,
    workspaceRoot: string,
  ) {
    if (!configuredPath) return undefined;
    return isAbsolute(configuredPath)
      ? configuredPath
      : join(workspaceRoot, configuredPath);
  }

  private isLocalAsset(asset: Pick<Asset, 'bucket' | 'region'>) {
    return (
      asset.bucket === LOCAL_ASSET_BUCKET || asset.region === LOCAL_ASSET_REGION
    );
  }

  private parseContentTypeHeader(value: string | string[] | undefined) {
    const rawValue = Array.isArray(value) ? value[0] : value;
    return rawValue?.split(';')[0]?.trim().toLowerCase();
  }

  private getConfiguredHttpUrl(...keys: string[]) {
    for (const key of keys) {
      const value = this.config.get<string>(key)?.trim();
      if (value && /^https?:\/\//i.test(value)) return value;
    }
    return undefined;
  }

  private normalizeOriginalName(fileName: string) {
    const trimmed = fileName.trim();
    return trimmed ? trimmed.slice(0, 180) : null;
  }

  private toAssetResponse(asset: { id: string; publicUrl: string }) {
    return {
      id: asset.id,
      publicUrl: asset.publicUrl,
    };
  }
}
