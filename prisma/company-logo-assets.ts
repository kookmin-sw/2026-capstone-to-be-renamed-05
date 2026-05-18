import {
  AssetPurpose,
  AssetStatus,
  type Company,
  CompanyType,
  type PrismaClient,
} from "@prisma/client";
import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import { join } from "node:path";

export const GENERATED_COMPANY_LOGO_COUNT = 100;

const GENERATED_COMPANY_LOGO_PREFIX = "generated-logo";
const GENERATED_COMPANY_LOGO_PUBLIC_DIR = "company-logos";
const GENERATED_COMPANY_BACKGROUND_PUBLIC_DIR = "company-backgrounds";
const GENERATED_COMPANY_LOGO_COMPLETED_AT = new Date(
  "2026-05-18T00:00:00.000Z",
);
const GENERATED_COMPANY_BACKGROUND_COMPLETED_AT = new Date(
  "2026-05-18T00:00:00.000Z",
);

type CompanyLogoPrisma = Pick<PrismaClient, "asset" | "company">;

export type GeneratedCompanyLogo = {
  fileName: string;
  originalName: string;
  publicPath: string;
};

export type CompanyLogoAssetResult = {
  company: Company;
  logo: GeneratedCompanyLogo;
  changed: boolean;
};

export type GeneratedCompanyBackground = {
  fileName: string;
  originalName: string;
  publicPath: string;
};

export type CompanyBackgroundAssetResult = {
  company: Company;
  background: GeneratedCompanyBackground;
  changed: boolean;
};

export function pickGeneratedCompanyLogo(
  companyName: string,
): GeneratedCompanyLogo {
  const index = stableAssetIndex(companyName, GENERATED_COMPANY_LOGO_COUNT);
  const fileName = `${GENERATED_COMPANY_LOGO_PREFIX}-${pad(index + 1)}.svg`;

  return {
    fileName,
    originalName: `Accountit generated company logo ${pad(index + 1)}`,
    publicPath: `/${GENERATED_COMPANY_LOGO_PUBLIC_DIR}/${fileName}`,
  };
}

export function pickGeneratedCompanyBackground(
  companyName: string,
  companyType: CompanyType = CompanyType.GENERAL_COMPANY,
): GeneratedCompanyBackground {
  const backgrounds = COMPANY_PHOTO_BACKGROUNDS_BY_TYPE[companyType];
  const background =
    backgrounds[
      stableAssetIndex(`${companyName}:background`, backgrounds.length)
    ];

  return {
    ...background,
    publicPath: `/${GENERATED_COMPANY_BACKGROUND_PUBLIC_DIR}/${background.fileName}`,
  };
}

export async function ensureGeneratedCompanyLogoAsset(
  prisma: CompanyLogoPrisma,
  company: Company,
  options: { overwrite?: boolean } = {},
): Promise<CompanyLogoAssetResult> {
  const logo = pickGeneratedCompanyLogo(company.name);

  if (company.logoAssetId && !options.overwrite) {
    return { company, logo, changed: false };
  }

  const publicUrl = buildGeneratedCompanyLogoPublicUrl(logo.publicPath);
  const assetPath = `${GENERATED_COMPANY_LOGO_PUBLIC_DIR}/${logo.fileName}`;
  const key = `generated-company-logos/${company.id}/${logo.fileName}`;

  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.READY,
      bucket: getGeneratedCompanyLogoBucket(),
      region: getGeneratedCompanyImageRegion(),
      publicUrl,
      contentType: "image/svg+xml",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: logo.originalName,
      uploadedById: company.ownerUserId,
      companyId: company.id,
      completedAt: GENERATED_COMPANY_LOGO_COMPLETED_AT,
    },
    create: {
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.READY,
      bucket: getGeneratedCompanyLogoBucket(),
      region: getGeneratedCompanyImageRegion(),
      key,
      publicUrl,
      contentType: "image/svg+xml",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: logo.originalName,
      uploadedById: company.ownerUserId,
      companyId: company.id,
      completedAt: GENERATED_COMPANY_LOGO_COMPLETED_AT,
    },
  });

  const updatedCompany = await prisma.company.update({
    where: { id: company.id },
    data: { logoAsset: { connect: { id: asset.id } } },
  });

  return {
    company: updatedCompany,
    logo,
    changed: company.logoAssetId !== asset.id,
  };
}

export async function ensureGeneratedCompanyBackgroundAsset(
  prisma: CompanyLogoPrisma,
  company: Company,
  options: { overwrite?: boolean } = {},
): Promise<CompanyBackgroundAssetResult> {
  const background = pickGeneratedCompanyBackground(company.name, company.type);

  if (company.backgroundAssetId && !options.overwrite) {
    return { company, background, changed: false };
  }

  const publicUrl = buildGeneratedCompanyBackgroundPublicUrl(
    background.publicPath,
  );
  const assetPath = `${GENERATED_COMPANY_BACKGROUND_PUBLIC_DIR}/${background.fileName}`;
  const key = `generated-company-backgrounds/${company.id}/${background.fileName}`;

  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.READY,
      bucket: getGeneratedCompanyBackgroundBucket(),
      region: getGeneratedCompanyImageRegion(),
      publicUrl,
      contentType: getStaticAssetContentType(assetPath),
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: background.originalName,
      uploadedById: company.ownerUserId,
      companyId: company.id,
      completedAt: GENERATED_COMPANY_BACKGROUND_COMPLETED_AT,
    },
    create: {
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.READY,
      bucket: getGeneratedCompanyBackgroundBucket(),
      region: getGeneratedCompanyImageRegion(),
      key,
      publicUrl,
      contentType: getStaticAssetContentType(assetPath),
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: background.originalName,
      uploadedById: company.ownerUserId,
      companyId: company.id,
      completedAt: GENERATED_COMPANY_BACKGROUND_COMPLETED_AT,
    },
  });

  const updatedCompany = await prisma.company.update({
    where: { id: company.id },
    data: { backgroundAsset: { connect: { id: asset.id } } },
  });

  return {
    company: updatedCompany,
    background,
    changed: company.backgroundAssetId !== asset.id,
  };
}

function stableAssetIndex(seedValue: string, count: number) {
  const seed = seedValue.trim() || "unknown-company";
  const digest = createHash("sha256").update(seed).digest();
  return digest.readUInt32BE(0) % count;
}

function buildGeneratedCompanyLogoPublicUrl(publicPath: string) {
  const publicBaseUrl =
    process.env.COMPANY_LOGO_PUBLIC_BASE_URL?.trim() ||
    process.env.COMPANY_IMAGE_PUBLIC_BASE_URL?.trim() ||
    process.env.MOCK_PUBLIC_ASSET_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();

  if (!publicBaseUrl) return publicPath;

  return `${publicBaseUrl.replace(/\/+$/, "")}${publicPath}`;
}

function buildGeneratedCompanyBackgroundPublicUrl(publicPath: string) {
  const publicBaseUrl =
    process.env.COMPANY_BACKGROUND_PUBLIC_BASE_URL?.trim() ||
    process.env.COMPANY_IMAGE_PUBLIC_BASE_URL?.trim() ||
    process.env.MOCK_PUBLIC_ASSET_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();

  if (!publicBaseUrl) return publicPath;

  return `${publicBaseUrl.replace(/\/+$/, "")}${publicPath}`;
}

function getGeneratedCompanyLogoBucket() {
  return (
    process.env.COMPANY_LOGO_ASSET_BUCKET?.trim() ||
    process.env.COMPANY_IMAGE_ASSET_BUCKET?.trim() ||
    process.env.S3_ASSET_BUCKET?.trim() ||
    "static-public"
  );
}

function getGeneratedCompanyBackgroundBucket() {
  return (
    process.env.COMPANY_BACKGROUND_ASSET_BUCKET?.trim() ||
    process.env.COMPANY_IMAGE_ASSET_BUCKET?.trim() ||
    process.env.S3_ASSET_BUCKET?.trim() ||
    "static-public"
  );
}

function getGeneratedCompanyImageRegion() {
  return process.env.AWS_REGION?.trim() || "local";
}

function getStaticAssetByteSize(path: string) {
  try {
    return statSync(join(process.cwd(), "apps", "web", "public", path)).size;
  } catch {
    return 1;
  }
}

function getStaticAssetContentType(path: string) {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/svg+xml";
}

function pad(value: number) {
  return value.toString().padStart(3, "0");
}

const COMPANY_PHOTO_BACKGROUNDS_BY_TYPE: Record<
  CompanyType,
  Array<Pick<GeneratedCompanyBackground, "fileName" | "originalName">>
> = {
  [CompanyType.BIG4]: [
    {
      fileName: "big4.png",
      originalName: "Photorealistic high-rise accounting office",
    },
    {
      fileName: "financial-company.png",
      originalName: "Photorealistic finance office with skyline",
    },
  ],
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: [
    {
      fileName: "local-accounting-firm.png",
      originalName: "Photorealistic local accounting office",
    },
    {
      fileName: "mid-small-accounting-firm.png",
      originalName: "Photorealistic accounting desk with city view",
    },
  ],
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: [
    {
      fileName: "mid-small-accounting-firm.png",
      originalName: "Photorealistic accounting desk with city view",
    },
    {
      fileName: "local-accounting-firm.png",
      originalName: "Photorealistic local accounting office",
    },
  ],
  [CompanyType.FINANCIAL_COMPANY]: [
    {
      fileName: "financial-company.png",
      originalName: "Photorealistic finance office with monitors",
    },
    {
      fileName: "big4.png",
      originalName: "Photorealistic high-rise accounting office",
    },
  ],
  [CompanyType.GENERAL_COMPANY]: [
    {
      fileName: "general-company.png",
      originalName: "Photorealistic corporate finance workspace",
    },
    {
      fileName: "financial-company.png",
      originalName: "Photorealistic finance office with monitors",
    },
  ],
  [CompanyType.PUBLIC_INSTITUTION]: [
    {
      fileName: "public-institution.png",
      originalName: "Photorealistic public institution office",
    },
    {
      fileName: "general-company.png",
      originalName: "Photorealistic corporate finance workspace",
    },
  ],
};
