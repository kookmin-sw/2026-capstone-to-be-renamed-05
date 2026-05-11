import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetPurpose,
  AssetStatus,
  Company,
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  KicpaCondition,
  Label,
  PrismaClient,
  Source,
  TraineeStatus,
  UserRole,
} from "@prisma/client";
import argon2 from "argon2";
import { config as loadDotenv } from "dotenv";
import {
  resolveEnvFilePaths,
  resolvePrismaPostgresConfig,
} from "../apps/api/src/config/runtime-environment";
import { statSync } from "node:fs";
import { join } from "node:path";

for (const envFilePath of resolveEnvFilePaths()) {
  loadDotenv({ path: envFilePath, override: false });
}

const TARGET_COMPANY_COUNT = 75;
const TARGET_JOB_COUNT = 300;
const MOCK_PASSWORD = "password123";
const mockUsers = [
  {
    username: "test001",
    displayName: "테스트 관리자",
    role: UserRole.ADMIN,
  },
  {
    username: "test002",
    displayName: "테스트 개인회원",
    role: UserRole.JOB_SEEKER,
  },
];
const legacyMockUsers = [
  { username: "admin", displayName: "관리자", role: UserRole.ADMIN },
  { username: "jobseeker", displayName: "수습 CPA", role: UserRole.JOB_SEEKER },
  { username: "company", displayName: "기업 담당자", role: UserRole.COMPANY },
];

const { connectionString, schema } = resolvePrismaPostgresConfig();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }, schema ? { schema } : undefined),
});

type EmployeeTrendPoint = {
  month: string;
  joined: number;
  left: number;
  total: number;
};

type CompanyProfile = {
  name: string;
  type: CompanyType;
  websiteUrl: string;
  description: string;
  businessNumber: string;
  externalLinks: string[];
  tags: string[];
  employeeCount: number;
  averageSalary: number;
  foundedYear: number;
  employeeTrend: EmployeeTrendPoint[];
};

type SeedJob = {
  title: string;
  description: string;
  company: Company;
  source: Source;
  originalUrl: string;
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  companyType: CompanyType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution: boolean;
  minExperienceYears: number;
  maxExperienceYears: number | null;
  location: string;
  deadlineType: DeadlineType;
  deadline: Date | null;
  labels: Label[];
};

const months = [
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
];

const companyTypeDescriptions: Record<CompanyType, string> = {
  [CompanyType.BIG4]:
    "대형 회계법인형 조직으로 감사, 세무, Deal, Risk Advisory를 함께 운영합니다.",
  [CompanyType.LOCAL_ACCOUNTING_FIRM]:
    "중견·성장기업 감사와 세무 자문에 강점을 가진 로컬 회계법인입니다.",
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]:
    "스타트업과 개인사업자를 대상으로 세무 기장, 신고, CFO 자문을 제공하는 세무회계 조직입니다.",
  [CompanyType.FINANCIAL_COMPANY]:
    "금융 데이터와 리스크 관리 업무를 회계 전문성과 연결하는 금융 회사입니다.",
  [CompanyType.GENERAL_COMPANY]:
    "재무 리포팅과 내부회계관리제도 운영 역량을 중요하게 보는 일반 기업입니다.",
  [CompanyType.PUBLIC_INSTITUTION]:
    "공공 회계, 예산, 보조금 정산과 투명한 재무 관리를 다루는 공공기관입니다.",
};

const companyTypeTags: Record<CompanyType, string[]> = {
  [CompanyType.BIG4]: ["Big4", "대형법인", "신입"],
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: ["로컬", "감사", "수습"],
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: ["세무", "중소법인", "스타트업"],
  [CompanyType.FINANCIAL_COMPANY]: ["금융사", "리스크", "내부통제"],
  [CompanyType.GENERAL_COMPANY]: ["인하우스", "내부회계", "상장사"],
  [CompanyType.PUBLIC_INSTITUTION]: ["공공기관", "예산", "정산"],
};

const companyBackgroundByType: Record<
  CompanyType,
  { fileName: string; originalName: string }
> = {
  [CompanyType.BIG4]: {
    fileName: "big4.png",
    originalName: "Big4 accounting office background",
  },
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: {
    fileName: "local-accounting-firm.png",
    originalName: "Local accounting firm background",
  },
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: {
    fileName: "mid-small-accounting-firm.png",
    originalName: "Small tax accounting office background",
  },
  [CompanyType.FINANCIAL_COMPANY]: {
    fileName: "financial-company.png",
    originalName: "Financial company background",
  },
  [CompanyType.GENERAL_COMPANY]: {
    fileName: "general-company.png",
    originalName: "Corporate finance team background",
  },
  [CompanyType.PUBLIC_INSTITUTION]: {
    fileName: "public-institution.png",
    originalName: "Public institution finance office background",
  },
};

const companyLogoByName = new Map<
  string,
  { fileName: string; originalName: string }
>([
  [
    "한빛회계법인",
    {
      fileName: "hanbit-accounting.png",
      originalName: "Hanbit accounting logo",
    },
  ],
  [
    "두나무",
    {
      fileName: "dunamu.png",
      originalName: "Dunamu logo",
    },
  ],
  [
    "삼일회계법인",
    {
      fileName: "samil-accounting.png",
      originalName: "Samil accounting logo",
    },
  ],
  [
    "서율세무회계",
    {
      fileName: "seoyul-tax-accounting.png",
      originalName: "Seoyul tax accounting logo",
    },
  ],
  [
    "그린인사이트",
    {
      fileName: "green-insight.png",
      originalName: "Green Insight logo",
    },
  ],
]);

function buildMockPublicAssetUrl(path: string) {
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim() ||
    process.env.S3_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_LOCAL_ASSET_PUBLIC_BASE_URL?.trim() ||
    process.env.LOCAL_ASSET_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) return `/${path}`;
  return `${publicBaseUrl.replace(/\/+$/, "")}/${path}`;
}

function getMockStorageBucket() {
  return process.env.S3_ASSET_BUCKET?.trim() || "static-public";
}

function getMockStorageRegion() {
  return process.env.AWS_REGION?.trim() || "local";
}

function getStaticAssetByteSize(path: string) {
  try {
    return statSync(join(process.cwd(), "apps", "web", "public", path)).size;
  } catch {
    return 1;
  }
}

function calculateRecentAttritionRate(trend: EmployeeTrendPoint[]) {
  const recent = trend.slice(-3);
  if (!recent.length) return null;
  const leftTotal = recent.reduce((sum, point) => sum + point.left, 0);
  const averageTotal =
    recent.reduce((sum, point) => sum + point.total, 0) / recent.length;
  if (!averageTotal) return null;
  return Number(((leftTotal / averageTotal) * 100).toFixed(1));
}

function pad(value: number, width: number) {
  return value.toString().padStart(width, "0");
}

function createBusinessNumber(index: number) {
  return `${100 + (index % 800)}-${10 + (index % 89)}-${pad(
    10000 + ((index * 137) % 90000),
    5,
  )}`;
}

function createEmployeeTrend(index: number, type: CompanyType) {
  const baseTotalByType: Record<CompanyType, number> = {
    [CompanyType.BIG4]: 1800,
    [CompanyType.LOCAL_ACCOUNTING_FIRM]: 55,
    [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: 24,
    [CompanyType.FINANCIAL_COMPANY]: 110,
    [CompanyType.GENERAL_COMPANY]: 210,
    [CompanyType.PUBLIC_INSTITUTION]: 95,
  };
  const hiringScaleByType: Record<CompanyType, number> = {
    [CompanyType.BIG4]: 38,
    [CompanyType.LOCAL_ACCOUNTING_FIRM]: 4,
    [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: 2,
    [CompanyType.FINANCIAL_COMPANY]: 5,
    [CompanyType.GENERAL_COMPANY]: 8,
    [CompanyType.PUBLIC_INSTITUTION]: 3,
  };

  let total =
    baseTotalByType[type] +
    ((index * 17) % Math.max(20, baseTotalByType[type]));

  return months.map((month, monthIndex) => {
    const scale = hiringScaleByType[type];
    const joined = Math.max(0, (index + monthIndex * 3) % (scale + 1));
    const left = Math.max(0, (index + monthIndex * 2) % Math.max(2, scale - 1));
    total = Math.max(6, total + joined - left);

    return {
      month,
      joined,
      left,
      total,
    };
  });
}

function createGeneratedCompanyName(index: number, type: CompanyType) {
  const prefixes = [
    "가온",
    "누리",
    "다온",
    "라온",
    "마루",
    "바른",
    "세움",
    "온율",
    "율담",
    "정진",
    "지음",
    "태림",
    "해솔",
    "한울",
    "도담",
    "이음",
    "청안",
    "리더스",
    "우림",
    "현담",
    "브릿지",
    "스톤",
    "파인",
    "코어",
    "밸류",
    "온택스",
    "아크",
    "그로스",
    "리브",
    "모멘텀",
    "피크",
    "서연",
    "다정",
    "하람",
    "루트",
  ];
  const keywords = [
    "회계",
    "재무",
    "감사",
    "택스",
    "리스크",
    "인사이트",
    "파트너스",
    "솔루션",
  ];
  const prefix = prefixes[index % prefixes.length];
  const keyword =
    keywords[Math.floor(index / prefixes.length) % keywords.length];

  if (type === CompanyType.MID_SMALL_ACCOUNTING_FIRM) {
    return `${prefix}${keyword}세무회계`;
  }
  if (type === CompanyType.FINANCIAL_COMPANY) {
    return `${prefix}${keyword}파이낸스`;
  }
  if (type === CompanyType.GENERAL_COMPANY) {
    return `${prefix}${keyword}테크`;
  }
  if (type === CompanyType.PUBLIC_INSTITUTION) {
    return `${prefix}${keyword}공공재단`;
  }
  if (type === CompanyType.BIG4) {
    return `${prefix}${keyword}대형회계법인`;
  }
  return `${prefix}${keyword}회계법인`;
}

function createGeneratedCompanyProfiles(count: number): CompanyProfile[] {
  const typeCycle = [
    CompanyType.LOCAL_ACCOUNTING_FIRM,
    CompanyType.MID_SMALL_ACCOUNTING_FIRM,
    CompanyType.GENERAL_COMPANY,
    CompanyType.FINANCIAL_COMPANY,
    CompanyType.PUBLIC_INSTITUTION,
    CompanyType.BIG4,
  ];

  return Array.from({ length: count }, (_, index) => {
    const type = typeCycle[index % typeCycle.length];
    const name = createGeneratedCompanyName(index, type);
    const employeeTrend = createEmployeeTrend(index + 10, type);
    const latestTotal = employeeTrend[employeeTrend.length - 1].total;

    return {
      name,
      type,
      websiteUrl: `https://example.com/demo-company-${pad(index + 1, 3)}`,
      description: `${name}은(는) ${companyTypeDescriptions[type]} CPA와 회계 실무자가 공고 조건을 빠르게 비교할 수 있도록 만든 데모 회사 데이터입니다.`,
      businessNumber: createBusinessNumber(index + 500),
      externalLinks: [
        `https://example.com/demo-company-${pad(index + 1, 3)}/careers`,
      ],
      tags: companyTypeTags[type],
      employeeCount: latestTotal,
      averageSalary:
        4700 +
        ((index * 170) % 2600) +
        (type === CompanyType.BIG4 ? 1700 : 0) +
        (type === CompanyType.FINANCIAL_COMPANY ? 900 : 0),
      foundedYear: 1988 + ((index * 5) % 35),
      employeeTrend,
    };
  });
}

function createDeadline(index: number) {
  if (index % 11 === 0) {
    return { deadlineType: DeadlineType.ALWAYS_OPEN, deadline: null };
  }
  if (index % 7 === 0) {
    return { deadlineType: DeadlineType.UNTIL_FILLED, deadline: null };
  }

  const deadline = new Date(
    Date.UTC(2026, 4, 6 + ((index * 3) % 110), 14, 59, 59),
  );
  return { deadlineType: DeadlineType.FIXED_DATE, deadline };
}

function createLastCheckedAt(index: number) {
  return new Date(Date.UTC(2026, 4, 4, 23, index % 60, (index * 13) % 60));
}

function getSourceForJob(
  companyType: CompanyType,
  jobFamily: JobFamily,
  sources: {
    kicpaSource: Source;
    saraminSource: Source;
    big4Source: Source;
    companyCareerSource: Source;
    publicSource: Source;
  },
) {
  if (companyType === CompanyType.BIG4) return sources.big4Source;
  if (companyType === CompanyType.PUBLIC_INSTITUTION)
    return sources.publicSource;
  if (jobFamily === JobFamily.AUDIT || jobFamily === JobFamily.TAX) {
    return sources.kicpaSource;
  }
  if (companyType === CompanyType.GENERAL_COMPANY) {
    return sources.companyCareerSource;
  }
  return sources.saraminSource;
}

function createGeneratedJob(
  index: number,
  companies: Company[],
  sources: {
    kicpaSource: Source;
    saraminSource: Source;
    big4Source: Source;
    companyCareerSource: Source;
    publicSource: Source;
  },
  labelByName: Map<string, Label>,
): SeedJob {
  const jobFamilies = [
    JobFamily.AUDIT,
    JobFamily.TAX,
    JobFamily.FAS,
    JobFamily.DEAL,
    JobFamily.INTERNAL_ACCOUNTING,
    JobFamily.IN_HOUSE,
  ];
  const locations = [
    "서울 중구",
    "서울 강남구",
    "서울 영등포구",
    "서울 마포구",
    "경기 성남시",
    "경기 수원시",
    "인천 연수구",
    "부산 해운대구",
    "대전 유성구",
    "대구 수성구",
    "광주 서구",
    "세종시",
    "제주 제주시",
    "재택/하이브리드",
  ];
  const titleByFamily: Record<JobFamily, string[]> = {
    [JobFamily.AUDIT]: [
      "감사본부 신입 회계사",
      "외부감사 수습 CPA",
      "회계감사 경력직",
      "품질관리실 감사 담당자",
    ],
    [JobFamily.TAX]: [
      "세무조정 및 신고 담당자",
      "국제조세 주니어 컨설턴트",
      "법인세·부가세 실무자",
      "택스팀 수습 회계사",
    ],
    [JobFamily.FAS]: [
      "FAS 주니어 컨설턴트",
      "재무실사 프로젝트 회계사",
      "기업가치평가 담당자",
      "구조조정 자문 어소시에이트",
    ],
    [JobFamily.DEAL]: [
      "Deal Advisory 주니어",
      "M&A 재무자문 담당자",
      "Transaction Service 회계사",
      "투자 검토 재무분석가",
    ],
    [JobFamily.INTERNAL_ACCOUNTING]: [
      "내부회계관리제도 담당자",
      "내부통제 운영 평가 담당자",
      "SOX/ICFR 컨설턴트",
      "상장사 외부감사 대응 담당자",
    ],
    [JobFamily.IN_HOUSE]: [
      "재무회계팀 회계 담당자",
      "연결결산 및 공시 담당자",
      "관리회계 비즈니스 파트너",
      "FP&A 주니어 애널리스트",
    ],
  };
  const familyDescriptions: Record<JobFamily, string> = {
    [JobFamily.AUDIT]:
      "재무제표 감사, 내부통제 테스트, 감사조서 작성과 현장 커뮤니케이션을 담당합니다.",
    [JobFamily.TAX]:
      "세무조정, 신고 검토, 과세 이슈 리서치와 고객 커뮤니케이션을 담당합니다.",
    [JobFamily.FAS]:
      "재무실사, 가치평가, 사업계획 검토와 리포트 작성을 지원합니다.",
    [JobFamily.DEAL]:
      "M&A 거래 검토, 실사 자료 분석, 투자 의사결정용 재무 모델링을 담당합니다.",
    [JobFamily.INTERNAL_ACCOUNTING]:
      "내부회계관리제도 운영 평가, 통제 설계, 외부감사 대응 업무를 담당합니다.",
    [JobFamily.IN_HOUSE]:
      "월/분기 결산, 재무 리포팅, 예산 관리와 사업부 회계 이슈 대응을 담당합니다.",
  };
  const familyLabels: Record<JobFamily, string> = {
    [JobFamily.AUDIT]: "감사",
    [JobFamily.TAX]: "세무",
    [JobFamily.FAS]: "FAS",
    [JobFamily.DEAL]: "Deal",
    [JobFamily.INTERNAL_ACCOUNTING]: "내부회계",
    [JobFamily.IN_HOUSE]: "인하우스",
  };

  const company = companies[(index * 7 + 3) % companies.length];
  const jobFamily = jobFamilies[index % jobFamilies.length];
  const titleOptions = titleByFamily[jobFamily];
  const title =
    titleOptions[Math.floor(index / jobFamilies.length) % titleOptions.length];
  const minExperienceYears = index % 5 === 0 ? 0 : (index % 7) + 1;
  const maxExperienceYears =
    index % 9 === 0 ? null : minExperienceYears + 1 + (index % 3);
  const traineeStatus =
    minExperienceYears === 0 && company.type !== CompanyType.GENERAL_COMPANY
      ? TraineeStatus.AVAILABLE
      : index % 6 === 0
        ? TraineeStatus.UNCLEAR
        : TraineeStatus.UNAVAILABLE;
  const kicpaCondition =
    jobFamily === JobFamily.AUDIT || jobFamily === JobFamily.FAS
      ? index % 3 === 0
        ? KicpaCondition.REQUIRED
        : KicpaCondition.PREFERRED
      : jobFamily === JobFamily.INTERNAL_ACCOUNTING ||
          jobFamily === JobFamily.IN_HOUSE
        ? index % 4 === 0
          ? KicpaCondition.PREFERRED
          : KicpaCondition.NONE
        : index % 5 === 0
          ? KicpaCondition.UNCLEAR
          : KicpaCondition.PREFERRED;
  const employmentType =
    index % 17 === 0
      ? EmploymentType.INTERN
      : index % 13 === 0
        ? EmploymentType.CONTRACT
        : EmploymentType.FULL_TIME;
  const { deadlineType, deadline } = createDeadline(index);
  const source = getSourceForJob(company.type, jobFamily, sources);
  const labelNames = [
    familyLabels[jobFamily],
    minExperienceYears === 0 ? "신입" : "경력",
    traineeStatus === TraineeStatus.AVAILABLE ? "수습가능" : null,
    kicpaCondition === KicpaCondition.REQUIRED ? "KICPA필수" : null,
    kicpaCondition === KicpaCondition.PREFERRED ? "KICPA우대" : null,
    deadlineType === DeadlineType.ALWAYS_OPEN ? "상시채용" : null,
    deadline &&
    deadline.getTime() <= new Date(Date.UTC(2026, 4, 13, 14, 59, 59)).getTime()
      ? "마감임박"
      : null,
  ].filter((labelName): labelName is string => Boolean(labelName));

  return {
    title,
    description: `${company.name} ${title} 포지션입니다. ${familyDescriptions[jobFamily]} 경력 구간, 수습 가능 여부, KICPA 요건을 필터에서 확인할 수 있도록 구성한 데모 공고입니다.`,
    company,
    source,
    originalUrl: `https://example.com/generated/jobs/${pad(index + 1, 4)}`,
    jobFamily,
    employmentType,
    companyType: company.type,
    kicpaCondition,
    traineeStatus,
    practicalTrainingInstitution:
      traineeStatus === TraineeStatus.AVAILABLE &&
      (company.type === CompanyType.BIG4 ||
        company.type === CompanyType.LOCAL_ACCOUNTING_FIRM ||
        company.type === CompanyType.MID_SMALL_ACCOUNTING_FIRM),
    minExperienceYears,
    maxExperienceYears,
    location: locations[index % locations.length],
    deadlineType,
    deadline,
    labels: labelNames
      .map((labelName) => labelByName.get(labelName))
      .filter((label): label is Label => Boolean(label)),
  };
}

async function upsertJob(jobData: SeedJob, lastCheckedAt = new Date()) {
  const existing = await prisma.job.findFirst({
    where: { originalUrl: jobData.originalUrl },
  });
  const jobPayload = {
    title: jobData.title,
    description: jobData.description,
    companyId: jobData.company.id,
    sourceId: jobData.source.id,
    originalUrl: jobData.originalUrl,
    jobFamily: jobData.jobFamily,
    employmentType: jobData.employmentType,
    companyType: jobData.companyType,
    kicpaCondition: jobData.kicpaCondition,
    traineeStatus: jobData.traineeStatus,
    practicalTrainingInstitution: jobData.practicalTrainingInstitution,
    minExperienceYears: jobData.minExperienceYears,
    maxExperienceYears: jobData.maxExperienceYears,
    location: jobData.location,
    deadlineType: jobData.deadlineType,
    deadline: jobData.deadline,
    lastCheckedAt,
  };

  const savedJob = existing
    ? await prisma.job.update({
        where: { id: existing.id },
        data: jobPayload,
      })
    : await prisma.job.create({
        data: jobPayload,
      });

  await prisma.jobLabel.deleteMany({ where: { jobId: savedJob.id } });
  await prisma.jobLabel.createMany({
    data: jobData.labels.map((label) => ({
      jobId: savedJob.id,
      labelId: label.id,
    })),
    skipDuplicates: true,
  });
}

function buildCareerVerificationMetadata(company: Company) {
  if (company.type === CompanyType.BIG4) {
    return {
      careerVerificationSignals: ["BIG4", "MAJOR_ACCOUNTING_FIRM"],
      careerVerificationNote: "Mock seed: Big4 company type",
      careerVerificationSource: "mock-company-type",
    };
  }

  if (company.type === CompanyType.PUBLIC_INSTITUTION) {
    return {
      careerVerificationSignals: ["PUBLIC_INSTITUTION", "PUBLIC_EQUIVALENT"],
      careerVerificationNote: "Mock seed: public institution company type",
      careerVerificationSource: "mock-company-type",
    };
  }

  return null;
}

async function upsertCompanyBackgroundAsset(company: Company, ownerUserId: string) {
  const background = companyBackgroundByType[company.type];
  const assetPath = `company-backgrounds/${background.fileName}`;
  const publicUrl = buildMockPublicAssetUrl(assetPath);
  const key = `mock-company-backgrounds/${company.id}/${background.fileName}`;
  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      publicUrl,
      contentType: "image/png",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: background.originalName,
      uploadedById: ownerUserId,
      companyId: company.id,
      completedAt: new Date("2026-05-10T00:00:00.000Z"),
    },
    create: {
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      key,
      publicUrl,
      contentType: "image/png",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: background.originalName,
      uploadedById: ownerUserId,
      companyId: company.id,
      completedAt: new Date("2026-05-10T00:00:00.000Z"),
    },
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { backgroundAsset: { connect: { id: asset.id } } },
  });
}

async function upsertCompanyLogoAsset(company: Company, ownerUserId: string) {
  const logo = companyLogoByName.get(company.name);
  if (!logo) return;

  const assetPath = `company-logos/${logo.fileName}`;
  const publicUrl = buildMockPublicAssetUrl(assetPath);
  const key = `mock-company-logos/${company.id}/${logo.fileName}`;
  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      publicUrl,
      contentType: "image/png",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: logo.originalName,
      uploadedById: ownerUserId,
      companyId: company.id,
      completedAt: new Date("2026-05-10T00:00:00.000Z"),
    },
    create: {
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      key,
      publicUrl,
      contentType: "image/png",
      byteSize: getStaticAssetByteSize(assetPath),
      originalName: logo.originalName,
      uploadedById: ownerUserId,
      companyId: company.id,
      completedAt: new Date("2026-05-10T00:00:00.000Z"),
    },
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { logoAsset: { connect: { id: asset.id } } },
  });
}

async function main() {
  const passwordHash = await argon2.hash(MOCK_PASSWORD);

  const [
    kicpaSource,
    saraminSource,
    big4Source,
    companyCareerSource,
    publicSource,
  ] = await Promise.all([
    prisma.source.upsert({
      where: { name: "KICPA 구인 게시판" },
      update: { baseUrl: "https://www.kicpa.or.kr" },
      create: { name: "KICPA 구인 게시판", baseUrl: "https://www.kicpa.or.kr" },
    }),
    prisma.source.upsert({
      where: { name: "사람인" },
      update: { baseUrl: "https://www.saramin.co.kr" },
      create: { name: "사람인", baseUrl: "https://www.saramin.co.kr" },
    }),
    prisma.source.upsert({
      where: { name: "Big4 채용 페이지" },
      update: {},
      create: { name: "Big4 채용 페이지" },
    }),
    prisma.source.upsert({
      where: { name: "기업 채용 페이지" },
      update: {},
      create: { name: "기업 채용 페이지" },
    }),
    prisma.source.upsert({
      where: { name: "공공기관 채용 포털" },
      update: {},
      create: { name: "공공기관 채용 포털" },
    }),
  ]);

  const labelSeedData = [
    { name: "수습가능", color: "emerald" },
    { name: "KICPA우대", color: "blue" },
    { name: "KICPA필수", color: "indigo" },
    { name: "마감임박", color: "rose" },
    { name: "신입", color: "cyan" },
    { name: "경력", color: "slate" },
    { name: "감사", color: "violet" },
    { name: "세무", color: "amber" },
    { name: "FAS", color: "fuchsia" },
    { name: "Deal", color: "purple" },
    { name: "내부회계", color: "orange" },
    { name: "인하우스", color: "teal" },
    { name: "상시채용", color: "green" },
  ];
  const labels = await Promise.all(
    labelSeedData.map((label) =>
      prisma.label.upsert({
        where: { name: label.name },
        update: { color: label.color },
        create: label,
      }),
    ),
  );
  const labelByName = new Map(labels.map((label) => [label.name, label]));
  const traineeLabel = labelByName.get("수습가능")!;
  const kicpaPreferredLabel = labelByName.get("KICPA우대")!;
  const urgentLabel = labelByName.get("마감임박")!;

  const baseCompanyProfiles: CompanyProfile[] = [
    {
      name: "한빛회계법인",
      type: CompanyType.LOCAL_ACCOUNTING_FIRM,
      websiteUrl: "https://example.com/hanbit",
      description:
        "중견·성장기업 감사와 세무 자문에 강점을 가진 로컬 회계법인입니다. 수습 회계사가 감사 현장과 재무제표 검토 업무를 빠르게 익힐 수 있는 실무형 조직을 지향합니다.",
      businessNumber: "104-86-45219",
      externalLinks: ["https://example.com/hanbit/careers"],
      tags: ["로컬", "감사"],
      employeeCount: 64,
      averageSalary: 6200,
      foundedYear: 2014,
      employeeTrend: [
        { month: "2025-10", joined: 4, left: 1, total: 58 },
        { month: "2025-11", joined: 2, left: 1, total: 59 },
        { month: "2025-12", joined: 3, left: 0, total: 62 },
        { month: "2026-01", joined: 2, left: 2, total: 62 },
        { month: "2026-02", joined: 5, left: 1, total: 66 },
        { month: "2026-03", joined: 1, left: 3, total: 64 },
      ],
    },
    {
      name: "삼일회계법인",
      type: CompanyType.BIG4,
      websiteUrl: "https://example.com/samil",
      description:
        "감사, 세무, Deal, Risk Advisory를 폭넓게 다루는 대형 회계법인입니다. 산업별 전문 조직과 교육 체계를 바탕으로 주니어 회계사의 프로젝트 경험 축적을 지원합니다.",
      businessNumber: "110-81-34892",
      externalLinks: ["https://example.com/samil/careers"],
      tags: ["Big4", "신입"],
      employeeCount: 3910,
      averageSalary: 7600,
      foundedYear: 1971,
      employeeTrend: [
        { month: "2025-10", joined: 132, left: 42, total: 3820 },
        { month: "2025-11", joined: 88, left: 55, total: 3853 },
        { month: "2025-12", joined: 96, left: 47, total: 3902 },
        { month: "2026-01", joined: 71, left: 63, total: 3910 },
        { month: "2026-02", joined: 54, left: 60, total: 3904 },
        { month: "2026-03", joined: 80, left: 74, total: 3910 },
      ],
    },
    {
      name: "두나무",
      type: CompanyType.GENERAL_COMPANY,
      websiteUrl: "https://example.com/dunamu",
      description:
        "디지털 자산과 핀테크 서비스를 운영하는 기술 기업입니다. 내부회계관리제도, 재무 리포팅, 통제 설계 영역에서 회계 전문성을 제품 조직과 연결합니다.",
      businessNumber: "120-88-18432",
      externalLinks: ["https://example.com/dunamu/careers"],
      tags: ["인하우스", "내부회계"],
      employeeCount: 720,
      averageSalary: 8800,
      foundedYear: 2012,
      employeeTrend: [
        { month: "2025-10", joined: 24, left: 13, total: 702 },
        { month: "2025-11", joined: 18, left: 9, total: 711 },
        { month: "2025-12", joined: 15, left: 12, total: 714 },
        { month: "2026-01", joined: 21, left: 16, total: 719 },
        { month: "2026-02", joined: 16, left: 18, total: 717 },
        { month: "2026-03", joined: 19, left: 16, total: 720 },
      ],
    },
    {
      name: "서율세무회계",
      type: CompanyType.MID_SMALL_ACCOUNTING_FIRM,
      websiteUrl: "https://example.com/seoyul",
      description:
        "스타트업과 개인사업자를 대상으로 세무 기장, 신고, CFO 자문을 제공하는 부티크 세무회계 조직입니다. 공고가 없는 기간에도 상시 인재풀을 운영합니다.",
      businessNumber: "214-90-67351",
      externalLinks: ["https://example.com/seoyul/about"],
      tags: ["세무", "스타트업"],
      employeeCount: 28,
      averageSalary: 5100,
      foundedYear: 2018,
      employeeTrend: [
        { month: "2025-10", joined: 1, left: 0, total: 25 },
        { month: "2025-11", joined: 2, left: 1, total: 26 },
        { month: "2025-12", joined: 0, left: 0, total: 26 },
        { month: "2026-01", joined: 2, left: 0, total: 28 },
        { month: "2026-02", joined: 1, left: 1, total: 28 },
        { month: "2026-03", joined: 1, left: 1, total: 28 },
      ],
    },
    {
      name: "그린인사이트",
      type: CompanyType.FINANCIAL_COMPANY,
      websiteUrl: "https://example.com/greeninsight",
      description:
        "ESG 데이터와 투자 리서치를 결합한 금융 분석 회사입니다. 회계·재무 데이터 품질 관리와 지속가능성 공시 검토 역량을 중요하게 봅니다.",
      businessNumber: "101-87-92014",
      externalLinks: ["https://example.com/greeninsight/careers"],
      tags: ["금융사", "ESG"],
      employeeCount: 116,
      averageSalary: 6900,
      foundedYear: 2019,
      employeeTrend: [
        { month: "2025-10", joined: 5, left: 2, total: 108 },
        { month: "2025-11", joined: 3, left: 1, total: 110 },
        { month: "2025-12", joined: 4, left: 2, total: 112 },
        { month: "2026-01", joined: 6, left: 3, total: 115 },
        { month: "2026-02", joined: 2, left: 2, total: 115 },
        { month: "2026-03", joined: 4, left: 3, total: 116 },
      ],
    },
  ];

  const companyProfiles = [
    ...baseCompanyProfiles,
    ...createGeneratedCompanyProfiles(
      TARGET_COMPANY_COUNT - baseCompanyProfiles.length,
    ),
  ].map((company) => ({
    ...company,
    recentAttritionRate: calculateRecentAttritionRate(company.employeeTrend),
  }));

  await prisma.user.deleteMany({
    where: {
      OR: legacyMockUsers,
      jobSubmissions: { none: {} },
    },
  });
  for (const user of mockUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        displayName: user.displayName,
        role: user.role,
      },
      create: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        role: user.role,
      },
    });
  }

  const companyOwners = await Promise.all(
    companyProfiles.map((company, index) => {
      const username = `test${pad(index + 3, 3)}`;
      const userPayload = {
        username,
        passwordHash,
        displayName: `${company.name} 담당자`,
        role: UserRole.COMPANY,
      };

      return prisma.user.upsert({
        where: { username },
        update: userPayload,
        create: userPayload,
      });
    }),
  );

  const companies = await Promise.all(
    companyProfiles.map((company, index) =>
      prisma.company.upsert({
        where: { name: company.name },
        update: {
          ...company,
          ownerUserId: companyOwners[index].id,
        },
        create: {
          ...company,
          ownerUserId: companyOwners[index].id,
        },
      }),
    ),
  );

  await Promise.all(
    companies.map((company, index) =>
      upsertCompanyBackgroundAsset(company, companyOwners[index].id),
    ),
  );
  await Promise.all(
    companies.map((company, index) =>
      upsertCompanyLogoAsset(company, companyOwners[index].id),
    ),
  );

  for (const company of companies) {
    const metadata = buildCareerVerificationMetadata(company);
    if (metadata) {
      await prisma.companyMetadata.upsert({
        where: { companyId: company.id },
        update: metadata,
        create: {
          companyId: company.id,
          ...metadata,
        },
      });
    } else {
      await prisma.companyMetadata.deleteMany({
        where: { companyId: company.id },
      });
    }
  }

  const baseJobs: SeedJob[] = [
    {
      title: "수습 CPA 감사본부 채용",
      description:
        "수습 CPA 지원 가능. 회계감사 보조와 재무제표 검토 업무를 수행합니다.",
      company: companies[0],
      source: kicpaSource,
      originalUrl: "https://example.com/jobs/hanbit-audit-trainee",
      jobFamily: JobFamily.AUDIT,
      employmentType: EmploymentType.FULL_TIME,
      companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
      kicpaCondition: KicpaCondition.PREFERRED,
      traineeStatus: TraineeStatus.AVAILABLE,
      practicalTrainingInstitution: true,
      minExperienceYears: 0,
      maxExperienceYears: 1,
      location: "서울 중구",
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: new Date("2026-05-08T14:59:59.000Z"),
      labels: [traineeLabel, kicpaPreferredLabel, urgentLabel],
    },
    {
      title: "Deal Advisory 주니어 회계사",
      description:
        "FDD, valuation, transaction service 프로젝트를 지원할 주니어 회계사를 채용합니다.",
      company: companies[1],
      source: big4Source,
      originalUrl: "https://example.com/jobs/samil-deal-junior",
      jobFamily: JobFamily.DEAL,
      employmentType: EmploymentType.FULL_TIME,
      companyType: CompanyType.BIG4,
      kicpaCondition: KicpaCondition.REQUIRED,
      traineeStatus: TraineeStatus.UNAVAILABLE,
      practicalTrainingInstitution: false,
      minExperienceYears: 1,
      maxExperienceYears: 3,
      location: "서울 영등포구",
      deadlineType: DeadlineType.UNTIL_FILLED,
      deadline: null,
      labels: [kicpaPreferredLabel],
    },
    {
      title: "내부회계관리제도 담당자",
      description:
        "상장사 내부회계 운영 평가, 통제 설계, 외부감사 대응 업무를 담당합니다.",
      company: companies[2],
      source: saraminSource,
      originalUrl: "https://example.com/jobs/dunamu-icfr",
      jobFamily: JobFamily.INTERNAL_ACCOUNTING,
      employmentType: EmploymentType.FULL_TIME,
      companyType: CompanyType.GENERAL_COMPANY,
      kicpaCondition: KicpaCondition.PREFERRED,
      traineeStatus: TraineeStatus.UNCLEAR,
      practicalTrainingInstitution: false,
      minExperienceYears: 4,
      maxExperienceYears: 8,
      location: "서울 강남구",
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: new Date("2026-05-31T14:59:59.000Z"),
      labels: [kicpaPreferredLabel],
    },
  ];

  for (const jobData of baseJobs) {
    await upsertJob(jobData);
  }

  const generatedJobs = Array.from(
    { length: TARGET_JOB_COUNT - baseJobs.length },
    (_, index) =>
      createGeneratedJob(
        index,
        companies,
        {
          kicpaSource,
          saraminSource,
          big4Source,
          companyCareerSource,
          publicSource,
        },
        labelByName,
      ),
  );

  for (const [index, jobData] of generatedJobs.entries()) {
    await upsertJob(jobData, createLastCheckedAt(index));
  }

  console.log(
    `Inserted or updated mock data: ${TARGET_COMPANY_COUNT} companies, ${TARGET_JOB_COUNT} jobs, ${TARGET_COMPANY_COUNT + mockUsers.length} users.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
