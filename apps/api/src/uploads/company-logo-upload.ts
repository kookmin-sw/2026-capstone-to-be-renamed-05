import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const COMPANY_LOGO_FIELD_NAME = 'companyLogo';
export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const allowedImageTypes = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

export type UploadedCompanyLogoFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

export async function saveCompanyLogoUpload(
  file: UploadedCompanyLogoFile | undefined,
) {
  if (!file?.buffer) {
    throw new BadRequestException('업로드할 기업 이미지 파일이 필요합니다.');
  }

  const extension = allowedImageTypes.get(file.mimetype ?? '');
  if (!extension) {
    throw new BadRequestException(
      '기업 이미지는 PNG, JPG, WEBP, GIF 파일만 업로드할 수 있습니다.',
    );
  }

  if ((file.size ?? file.buffer.length) > COMPANY_LOGO_MAX_BYTES) {
    throw new BadRequestException('기업 이미지는 2MB 이하로 업로드해 주세요.');
  }

  const uploadDir = resolveUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDir, fileName), file.buffer);

  return `/uploads/company-logos/${fileName}`;
}

function resolveUploadDir() {
  if (process.env.COMPANY_LOGO_UPLOAD_DIR) {
    return process.env.COMPANY_LOGO_UPLOAD_DIR;
  }

  const cwd = process.cwd();
  const publicDir = [
    path.resolve(cwd, 'apps/web/public'),
    path.resolve(cwd, '../web/public'),
    path.resolve(cwd, '../../apps/web/public'),
  ].find((candidate) => existsSync(candidate));

  return path.join(
    publicDir ?? path.resolve(cwd, 'apps/web/public'),
    'uploads/company-logos',
  );
}
