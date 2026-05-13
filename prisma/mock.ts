import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetPurpose,
  AssetStatus,
  BookmarkTargetType,
  CommunityBoardType,
  CommunityPostStatus,
  Company,
  CompanyType,
  CpaVerificationStatus,
  DeadlineType,
  EmploymentHistoryStatus,
  EmploymentType,
  JobFamily,
  JobStatus,
  KicpaCondition,
  Label,
  NotificationType,
  PersonalCareerStage,
  Prisma,
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
const jobSeekerMockUsers = [
  {
    username: "test002",
    displayName: "테스트 개인회원",
    profileImageUrl: "/mock-avatars/cpa-trainee.svg",
    careerStage: PersonalCareerStage.CPA_UNPLACED,
    employmentHistoryStatus: EmploymentHistoryStatus.NONE,
  },
  {
    username: "community001",
    displayName: "감사준비생 민서",
    profileImageUrl: "/mock-avatars/audit-learner.svg",
    careerStage: PersonalCareerStage.CPA_UNPLACED,
    employmentHistoryStatus: EmploymentHistoryStatus.NONE,
  },
  {
    username: "community002",
    displayName: "수습회계사 준호",
    profileImageUrl: "/mock-avatars/trainee-junior.svg",
    careerStage: PersonalCareerStage.TRAINEE,
    employmentHistoryStatus: EmploymentHistoryStatus.HAS_EMPLOYMENT,
  },
  {
    username: "community003",
    displayName: "택스 실무자 서윤",
    profileImageUrl: "/mock-avatars/tax-advisor.svg",
    careerStage: PersonalCareerStage.LICENSED_CPA,
    employmentHistoryStatus: EmploymentHistoryStatus.HAS_EMPLOYMENT,
  },
  {
    username: "community004",
    displayName: "내부회계 지민",
    profileImageUrl: "/mock-avatars/icfr-specialist.svg",
    careerStage: PersonalCareerStage.LICENSED_CPA,
    employmentHistoryStatus: EmploymentHistoryStatus.HAS_EMPLOYMENT,
  },
  {
    username: "community005",
    displayName: "FAS 지원자 도윤",
    profileImageUrl: "/mock-avatars/fas-analyst.svg",
    careerStage: PersonalCareerStage.TRAINEE,
    employmentHistoryStatus: EmploymentHistoryStatus.HAS_EMPLOYMENT,
  },
  {
    username: "community006",
    displayName: "공시 담당 하린",
    profileImageUrl: "/mock-avatars/reporting-lead.svg",
    careerStage: PersonalCareerStage.LICENSED_CPA,
    employmentHistoryStatus: EmploymentHistoryStatus.HAS_EMPLOYMENT,
  },
];
const mockUsers = [
  {
    username: "test001",
    displayName: "테스트 관리자",
    role: UserRole.ADMIN,
  },
  ...jobSeekerMockUsers.map((user) => ({
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.profileImageUrl,
    role: UserRole.JOB_SEEKER,
  })),
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

const companyFocusPhrases: Record<CompanyType, string[]> = {
  [CompanyType.BIG4]: [
    "상장사 감사와 글로벌 리포팅 프로젝트 비중이 높습니다",
    "산업별 감사본부와 Deal, Tax, Risk 조직이 함께 움직입니다",
  ],
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: [
    "중견기업 외부감사와 세무조정 업무를 균형 있게 운영합니다",
    "수습 CPA가 감사 현장, 조서 작성, 고객 커뮤니케이션을 순차적으로 경험합니다",
  ],
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: [
    "초기 스타트업과 개인사업자의 기장, 신고, 월간 재무 관리를 지원합니다",
    "세무 이슈 리서치와 CFO 아웃소싱 업무를 함께 다룹니다",
  ],
  [CompanyType.FINANCIAL_COMPANY]: [
    "금융상품 회계, 리스크 데이터, 내부통제 검토를 연결합니다",
    "투자 의사결정에 필요한 재무 분석과 규제 대응 자료를 만듭니다",
  ],
  [CompanyType.GENERAL_COMPANY]: [
    "월결산, 연결결산, 공시, 내부회계 운영을 실무 중심으로 다룹니다",
    "사업부와 가까운 재무 파트너 역할을 중요하게 봅니다",
  ],
  [CompanyType.PUBLIC_INSTITUTION]: [
    "예산 집행, 보조금 정산, 공공 회계 기준 검토를 담당합니다",
    "감사 대응과 투명한 재무 보고 체계를 중시합니다",
  ],
};

const companyCulturePhrases = [
  "신입에게는 체크리스트와 리뷰어 피드백을 제공하고, 경력자에게는 프로젝트 리드 기회를 부여합니다",
  "하이브리드 근무와 집중 리뷰 기간을 구분해 업무 리듬을 관리합니다",
  "공고마다 전형 절차, 필요 경력, CPA 관련 조건을 명확히 쓰는 것을 채용 원칙으로 삼습니다",
  "교육 세션, 케이스 스터디, 실무 문서 템플릿을 통해 온보딩 속도를 높입니다",
];

type MockImageAsset = { fileName: string; originalName: string };

const companyBackgroundByType: Record<CompanyType, MockImageAsset[]> = {
  [CompanyType.BIG4]: [
    {
      fileName: "big4.png",
      originalName: "Big4 accounting office background",
    },
    {
      fileName: "audit-tower.svg",
      originalName: "Audit tower background",
    },
  ],
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: [
    {
      fileName: "local-accounting-firm.png",
      originalName: "Local accounting firm background",
    },
    {
      fileName: "local-desk.svg",
      originalName: "Local accounting desk background",
    },
  ],
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: [
    {
      fileName: "mid-small-accounting-firm.png",
      originalName: "Small tax accounting office background",
    },
    {
      fileName: "tax-studio.svg",
      originalName: "Tax studio background",
    },
  ],
  [CompanyType.FINANCIAL_COMPANY]: [
    {
      fileName: "financial-company.png",
      originalName: "Financial company background",
    },
    {
      fileName: "finance-grid.svg",
      originalName: "Finance grid background",
    },
  ],
  [CompanyType.GENERAL_COMPANY]: [
    {
      fileName: "general-company.png",
      originalName: "Corporate finance team background",
    },
    {
      fileName: "corporate-ledger.svg",
      originalName: "Corporate ledger background",
    },
  ],
  [CompanyType.PUBLIC_INSTITUTION]: [
    {
      fileName: "public-institution.png",
      originalName: "Public institution finance office background",
    },
    {
      fileName: "public-archive.svg",
      originalName: "Public archive background",
    },
  ],
};

const companyLogoByName = new Map<string, MockImageAsset>([
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

const companyLogoPalette: MockImageAsset[] = [
  { fileName: "mock-logo-apex.svg", originalName: "Apex mock logo" },
  { fileName: "mock-logo-bridge.svg", originalName: "Bridge mock logo" },
  { fileName: "mock-logo-core.svg", originalName: "Core mock logo" },
  { fileName: "mock-logo-delta.svg", originalName: "Delta mock logo" },
  { fileName: "mock-logo-eon.svg", originalName: "Eon mock logo" },
  { fileName: "mock-logo-firm.svg", originalName: "Firm mock logo" },
  { fileName: "mock-logo-grid.svg", originalName: "Grid mock logo" },
  { fileName: "mock-logo-halo.svg", originalName: "Halo mock logo" },
  { fileName: "mock-logo-ion.svg", originalName: "Ion mock logo" },
  { fileName: "mock-logo-juno.svg", originalName: "Juno mock logo" },
];

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

function getMockAssetContentType(path: string) {
  return path.endsWith(".svg") ? "image/svg+xml" : "image/png";
}

function pickCompanyBackground(company: Company, index: number) {
  const backgrounds = companyBackgroundByType[company.type];
  return backgrounds[index % backgrounds.length];
}

function pickCompanyLogo(company: Company, index: number) {
  return (
    companyLogoByName.get(company.name) ??
    companyLogoPalette[index % companyLogoPalette.length]
  );
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
    const focus =
      companyFocusPhrases[type][index % companyFocusPhrases[type].length];
    const culture = companyCulturePhrases[index % companyCulturePhrases.length];
    const secondaryTag =
      focus.includes("내부통제") || focus.includes("내부회계")
        ? "내부통제"
        : focus.includes("세무") || focus.includes("신고")
          ? "세무실무"
          : focus.includes("Deal") || focus.includes("투자")
            ? "재무분석"
            : focus.includes("수습")
              ? "수습교육"
              : "공시대응";

    return {
      name,
      type,
      websiteUrl: `https://example.com/demo-company-${pad(index + 1, 3)}`,
      description: `${name}은(는) ${companyTypeDescriptions[type]} ${focus}. ${culture}. 채용 공고에는 담당 업무, 필수/우대 조건, 수습 가능 여부, 전형 절차, 근무 방식을 빠짐없이 제공하도록 관리합니다.`,
      businessNumber: createBusinessNumber(index + 500),
      externalLinks: [
        `https://example.com/demo-company-${pad(index + 1, 3)}/careers`,
        `https://example.com/demo-company-${pad(index + 1, 3)}/about`,
      ],
      tags: [...new Set([...companyTypeTags[type], secondaryTag])],
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
    description: `${company.name} ${title} 포지션입니다. ${familyDescriptions[jobFamily]} 주요 업무는 월별 산출물 관리, 실무 자료 검토, 이해관계자 커뮤니케이션입니다. 지원자는 ${minExperienceYears === 0 ? "신입 또는 수습 CPA 지원자" : `${minExperienceYears}년 이상 실무 경험자`}를 우선 검토하며, KICPA 조건과 수습 가능 여부는 공고 조건에 맞춰 명시했습니다. 근무지는 ${locations[index % locations.length]}이며 서류 검토 후 실무 인터뷰와 처우 협의를 진행합니다.`,
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

async function upsertCompanyBackgroundAsset(
  company: Company,
  ownerUserId: string,
  index: number,
) {
  const background = pickCompanyBackground(company, index);
  const assetPath = `company-backgrounds/${background.fileName}`;
  const publicUrl = buildMockPublicAssetUrl(assetPath);
  const key = `mock-company-backgrounds/${company.id}/${background.fileName}`;
  const contentType = getMockAssetContentType(assetPath);
  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_BACKGROUND,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      publicUrl,
      contentType,
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
      contentType,
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

async function upsertCompanyLogoAsset(
  company: Company,
  ownerUserId: string,
  index: number,
) {
  const logo = pickCompanyLogo(company, index);
  const assetPath = `company-logos/${logo.fileName}`;
  const publicUrl = buildMockPublicAssetUrl(assetPath);
  const key = `mock-company-logos/${company.id}/${logo.fileName}`;
  const contentType = getMockAssetContentType(assetPath);
  const asset = await prisma.asset.upsert({
    where: { key },
    update: {
      purpose: AssetPurpose.COMPANY_LOGO,
      status: AssetStatus.READY,
      bucket: getMockStorageBucket(),
      region: getMockStorageRegion(),
      publicUrl,
      contentType,
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
      contentType,
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

const communitySeedUsernames = jobSeekerMockUsers.map((user) => user.username);

function seedDate(dayOffset: number, hour = 9) {
  return new Date(Date.UTC(2026, 4, 13 - dayOffset, hour, 0, 0));
}

async function seedCommunityData(
  userByUsername: Map<string, { id: string; username: string }>,
) {
  const authors = communitySeedUsernames.map((username) => {
    const user = userByUsername.get(username);
    if (!user) throw new Error(`Missing mock user: ${username}`);
    return user;
  });

  await prisma.communityAnswer.deleteMany({
    where: { authorId: { in: authors.map((author) => author.id) } },
  });
  await prisma.communityPost.deleteMany({
    where: { authorId: { in: authors.map((author) => author.id) } },
  });

  const postSeeds = [
    {
      boardType: CommunityBoardType.CPA_PREP,
      title: "1차 합격 후 수습 공고를 언제부터 봐야 할까요?",
      content:
        "감사 시즌 전에 수습 가능한 로컬 회계법인 공고를 미리 보고 있습니다. KICPA 우대와 수습 가능 표시가 같이 있는 공고를 중심으로 보면 되는지, 지원 타이밍은 어느 정도가 적당한지 궁금합니다.",
      status: CommunityPostStatus.ANSWERED,
      tags: ["수습", "감사", "지원시기"],
      authorIndex: 1,
      isAnonymous: false,
      viewCount: 128,
      likeCount: 9,
      dayOffset: 1,
      answers: [
        {
          authorIndex: 2,
          content:
            "수습 가능 표시와 실무수습기관 여부를 같이 확인하세요. 5월 이후에는 마감이 빠른 공고가 많아서 북마크해 두고 마감순으로 보는 편이 좋았습니다.",
          isAnonymous: false,
          likeCount: 6,
          isAccepted: true,
        },
        {
          authorIndex: 3,
          content:
            "지원서 준비가 덜 됐어도 관심 공고로 저장해 두면 마감 임박 알림을 받을 수 있어서 놓치는 일이 줄었습니다.",
          isAnonymous: true,
          likeCount: 3,
        },
      ],
    },
    {
      boardType: CommunityBoardType.TRAINEE,
      title: "실무수습기관 가능 여부가 애매한 공고는 어떻게 확인하시나요?",
      content:
        "공고에는 수습 가능이라고 쓰여 있는데 회사 소개에는 실무수습기관인지 명확하지 않은 경우가 있습니다. 지원 전 문의 메일을 보내는 게 좋을까요?",
      status: CommunityPostStatus.QUESTION,
      tags: ["실무수습", "공고확인"],
      authorIndex: 2,
      isAnonymous: true,
      viewCount: 86,
      likeCount: 4,
      dayOffset: 2,
      answers: [
        {
          authorIndex: 4,
          content:
            "채용 담당자에게 실무수습기관 등록 여부와 수습 인정 시작일을 같이 물어보면 답변이 명확합니다. 공고 원문 링크도 함께 보관해 두세요.",
          isAnonymous: false,
          likeCount: 5,
        },
      ],
    },
    {
      boardType: CommunityBoardType.SENIOR,
      title: "내부회계 경력으로 이직할 때 감사 경력은 얼마나 인정되나요?",
      content:
        "외부감사 3년차입니다. 내부회계관리제도 담당자 공고를 보면 4년 이상을 요구하는 곳도 있고 감사 경력을 우대하는 곳도 있던데, 실제로는 어느 정도 인정받는지 경험이 궁금합니다.",
      status: CommunityPostStatus.ANSWERED,
      tags: ["내부회계", "이직", "경력"],
      authorIndex: 5,
      isAnonymous: false,
      viewCount: 214,
      likeCount: 18,
      dayOffset: 3,
      answers: [
        {
          authorIndex: 6,
          content:
            "통제 테스트와 감사 대응 경험을 구체적으로 설명하면 인정받기 쉽습니다. 다만 운영평가 문서화나 RCM 개선 경험이 있으면 훨씬 유리했습니다.",
          isAnonymous: false,
          likeCount: 12,
          isAccepted: true,
        },
        {
          authorIndex: 4,
          content:
            "회사마다 다르지만 상장사 내부회계 공고는 감사 경력을 실무 기반으로 보는 곳이 많았습니다.",
          isAnonymous: true,
          likeCount: 4,
        },
      ],
    },
    {
      boardType: CommunityBoardType.FREE,
      title: "마감 임박 공고 필터 조합 공유합니다",
      content:
        "저는 서울, 감사, 수습 가능, KICPA 우대, 14일 이내 마감 조합을 프리셋으로 저장해 두고 매일 확인합니다. 관심 공고로 저장한 뒤 원문 링크까지 열어 두면 지원 일정 관리가 편합니다.",
      status: CommunityPostStatus.INFO,
      tags: ["프리셋", "관심공고", "마감관리"],
      authorIndex: 0,
      isAnonymous: false,
      viewCount: 176,
      likeCount: 21,
      dayOffset: 4,
      answers: [
        {
          authorIndex: 1,
          content:
            "저도 비슷하게 쓰고 있는데 회사 유형까지 로컬로 좁히면 수습 공고 찾기가 더 쉬웠습니다.",
          isAnonymous: false,
          likeCount: 7,
        },
      ],
    },
    {
      boardType: CommunityBoardType.CPA_PREP,
      title: "FAS 주니어 공고는 어떤 태그를 봐야 하나요?",
      content:
        "감사보다 FAS 쪽에 관심이 있습니다. FAS, Deal, 재무실사, 가치평가가 같이 보이는 공고를 보면 되는지 궁금합니다.",
      status: CommunityPostStatus.QUESTION,
      tags: ["FAS", "Deal", "주니어"],
      authorIndex: 5,
      isAnonymous: true,
      viewCount: 65,
      likeCount: 5,
      dayOffset: 5,
      answers: [
        {
          authorIndex: 3,
          content:
            "FAS와 Deal을 같이 보고, 설명에 재무실사나 valuation이 들어간 공고를 우선 보세요. KICPA 필수보다는 우대가 많습니다.",
          isAnonymous: false,
          likeCount: 4,
        },
      ],
    },
    {
      boardType: CommunityBoardType.TRAINEE,
      title: "수습 중 원문 지원 클릭 후 따로 기록하시나요?",
      content:
        "관심 공고에 저장해 둔 뒤 원문에서 지원하면 제가 어디까지 진행했는지 헷갈립니다. 다들 별도 스프레드시트를 쓰시나요?",
      status: CommunityPostStatus.QUESTION,
      tags: ["지원관리", "관심공고"],
      authorIndex: 2,
      isAnonymous: false,
      viewCount: 47,
      likeCount: 2,
      dayOffset: 6,
      answers: [],
    },
    {
      boardType: CommunityBoardType.SENIOR,
      title: "상장사 공시 담당 공고 볼 때 체크하는 항목",
      content:
        "분기/반기/사업보고서 작성 경험, 연결 범위, 감사인 커뮤니케이션, 내부회계 협업 구조를 먼저 봅니다. 공고 내용이 부실하면 면접에서 역할 범위를 꼭 확인하세요.",
      status: CommunityPostStatus.INFO,
      tags: ["공시", "상장사", "체크리스트"],
      authorIndex: 6,
      isAnonymous: false,
      viewCount: 139,
      likeCount: 16,
      dayOffset: 7,
      answers: [
        {
          authorIndex: 4,
          content:
            "연결결산 담당 여부와 외부감사 대응 범위도 같이 확인하면 좋았습니다.",
          isAnonymous: false,
          likeCount: 6,
        },
      ],
    },
    {
      boardType: CommunityBoardType.FREE,
      title: "채용공고 설명이 자세한 회사가 확실히 지원하기 편하네요",
      content:
        "담당 업무와 우대 조건, 마감 방식, 실무수습 여부가 명확한 공고는 비교가 훨씬 쉽습니다. 데모 데이터에도 이런 공고가 더 많아지면 좋겠습니다.",
      status: CommunityPostStatus.FREE,
      tags: ["공고품질", "데이터"],
      authorIndex: 1,
      isAnonymous: true,
      viewCount: 94,
      likeCount: 11,
      dayOffset: 8,
      answers: [],
    },
  ];

  for (const [postIndex, seed] of postSeeds.entries()) {
    const post = await prisma.communityPost.create({
      data: {
        boardType: seed.boardType,
        title: seed.title,
        content: seed.content,
        status: seed.status,
        tags: seed.tags,
        authorId: authors[seed.authorIndex].id,
        isAnonymous: seed.isAnonymous,
        viewCount: seed.viewCount,
        likeCount: seed.likeCount,
        createdAt: seedDate(seed.dayOffset, 9 + (postIndex % 8)),
        updatedAt: seedDate(seed.dayOffset, 10 + (postIndex % 8)),
      },
    });

    let acceptedAnswerId: string | null = null;
    for (const [answerIndex, answerSeed] of seed.answers.entries()) {
      const answer = await prisma.communityAnswer.create({
        data: {
          postId: post.id,
          authorId: authors[answerSeed.authorIndex].id,
          content: answerSeed.content,
          isAnonymous: answerSeed.isAnonymous,
          likeCount: answerSeed.likeCount,
          isAccepted: Boolean(answerSeed.isAccepted),
          createdAt: seedDate(seed.dayOffset - 1, 8 + answerIndex),
          updatedAt: seedDate(seed.dayOffset - 1, 8 + answerIndex),
        },
      });
      if (answerSeed.isAccepted) acceptedAnswerId = answer.id;
    }

    if (acceptedAnswerId) {
      await prisma.communityPost.update({
        where: { id: post.id },
        data: {
          status: CommunityPostStatus.ANSWERED,
          acceptedAnswerId,
        },
      });
    }
  }
}

const orderedPresetKeys = [
  "search",
  "jobFamily",
  "companyType",
  "traineeStatus",
  "employmentType",
  "kicpaCondition",
  "deadlineType",
  "practicalTrainingInstitution",
  "deadlineWithinDays",
  "careerLevel",
  "minExperienceYears",
  "maxExperienceYears",
  "minCompanyAgeYears",
  "maxCompanyAgeYears",
  "maxAttritionRate",
  "salaryLevel",
  "sort",
] as const;

function orderPresetFilter(filter: Record<string, unknown>) {
  const ordered: Record<string, Prisma.InputJsonValue> = {};
  for (const key of orderedPresetKeys) {
    if (typeof filter[key] === "string" && filter[key]) {
      ordered[key] = filter[key];
    }
  }
  if (Array.isArray(filter.selectedLocations)) {
    ordered.selectedLocations = filter.selectedLocations.filter(
      (location): location is string => typeof location === "string",
    );
  }
  return ordered as Prisma.InputJsonObject;
}

async function seedBookmarksPresetsAndSubscriptions(
  userByUsername: Map<string, { id: string; username: string }>,
  labelByName: Map<string, Label>,
) {
  const seedUsers = ["test002", "community001", "community002"]
    .map((username) => userByUsername.get(username))
    .filter((user): user is { id: string; username: string } => Boolean(user));
  const seedUserIds = seedUsers.map((user) => user.id);
  const [jobs, companies] = await Promise.all([
    prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      take: 18,
    }),
    prisma.company.findMany({
      orderBy: [{ employeeCount: "desc" }, { name: "asc" }],
      take: 8,
    }),
  ]);

  await Promise.all([
    prisma.bookmark.deleteMany({ where: { userId: { in: seedUserIds } } }),
    prisma.userJobPreset.deleteMany({ where: { userId: { in: seedUserIds } } }),
    prisma.jobTagSubscription.deleteMany({
      where: { userId: { in: seedUserIds } },
    }),
    prisma.notification.deleteMany({ where: { userId: { in: seedUserIds } } }),
  ]);

  const bookmarkData = seedUsers.flatMap((user, userIndex) => [
    ...jobs.slice(userIndex * 4, userIndex * 4 + 6).map((job, index) => ({
      userId: user.id,
      targetType: BookmarkTargetType.JOB,
      targetId: job.id,
      createdAt: seedDate(7 - index, 7 + userIndex),
    })),
    ...companies
      .slice(userIndex * 2, userIndex * 2 + 2)
      .map((company, index) => ({
        userId: user.id,
        targetType: BookmarkTargetType.COMPANY,
        targetId: company.id,
        createdAt: seedDate(6 - index, 13 + userIndex),
      })),
  ]);
  if (bookmarkData.length) {
    await prisma.bookmark.createMany({
      data: bookmarkData,
      skipDuplicates: true,
    });
  }

  const presetSeeds = [
    {
      userIndex: 0,
      autoLabel: "서울 수습 감사",
      filterState: {
        jobFamily: JobFamily.AUDIT,
        traineeStatus: TraineeStatus.AVAILABLE,
        kicpaCondition: KicpaCondition.PREFERRED,
        practicalTrainingInstitution: "true",
        deadlineWithinDays: "14",
        selectedLocations: ["서울 중구", "서울 강남구"],
      },
      lastUsedAt: seedDate(0, 8),
    },
    {
      userIndex: 0,
      autoLabel: "내부회계 경력",
      filterState: {
        jobFamily: JobFamily.INTERNAL_ACCOUNTING,
        companyType: CompanyType.GENERAL_COMPANY,
        careerLevel: "experienced",
        minExperienceYears: "3",
        selectedLocations: ["서울 영등포구", "경기 성남시"],
      },
      lastUsedAt: seedDate(2, 18),
    },
    {
      userIndex: 1,
      autoLabel: "FAS·Deal 주니어",
      filterState: {
        jobFamily: `${JobFamily.FAS},${JobFamily.DEAL}`,
        kicpaCondition: KicpaCondition.PREFERRED,
        careerLevel: "junior",
        selectedLocations: ["서울 중구", "서울 여의도"],
      },
      lastUsedAt: seedDate(1, 12),
    },
    {
      userIndex: 2,
      autoLabel: "세무 신입·계약직 제외",
      filterState: {
        jobFamily: JobFamily.TAX,
        employmentType: EmploymentType.FULL_TIME,
        careerLevel: "entry",
        deadlineType: DeadlineType.FIXED_DATE,
      },
      lastUsedAt: null,
    },
  ];

  await prisma.userJobPreset.createMany({
    data: presetSeeds
      .filter((seed) => seedUsers[seed.userIndex])
      .map((seed) => {
        const filterState = orderPresetFilter(seed.filterState);
        return {
          userId: seedUsers[seed.userIndex].id,
          filterState,
          autoLabel: seed.autoLabel,
          filterSignature: JSON.stringify(filterState),
          lastUsedAt: seed.lastUsedAt,
          createdAt: seedDate(9 - seed.userIndex, 8),
        };
      }),
    skipDuplicates: true,
  });

  const subscribedLabels = ["수습가능", "마감임박", "KICPA우대", "내부회계"]
    .map((name) => labelByName.get(name))
    .filter((label): label is Label => Boolean(label));
  await prisma.jobTagSubscription.createMany({
    data: seedUsers.flatMap((user, userIndex) =>
      subscribedLabels.slice(0, 2 + userIndex).map((label) => ({
        userId: user.id,
        labelId: label.id,
        createdAt: seedDate(10 - userIndex, 9),
      })),
    ),
    skipDuplicates: true,
  });

  const primaryUser = seedUsers[0];
  const urgentLabel = labelByName.get("마감임박");
  const traineeLabel = labelByName.get("수습가능");
  if (primaryUser && jobs[0] && urgentLabel) {
    await prisma.notification.create({
      data: {
        userId: primaryUser.id,
        type: NotificationType.BOOKMARK_DEADLINE_SOON,
        title: "관심 공고 마감이 가까워졌습니다",
        body: `${jobs[0].title} 공고 마감일을 확인해 주세요.`,
        href: `/jobs/detail/?id=${jobs[0].id}`,
        jobId: jobs[0].id,
        labelId: urgentLabel.id,
        metadata: { source: "mock", targetType: "bookmark" },
        dedupeKey: `mock-bookmark-deadline-${jobs[0].id}`,
        createdAt: seedDate(0, 9),
      },
    });
  }
  if (primaryUser && jobs[1] && traineeLabel) {
    await prisma.notification.create({
      data: {
        userId: primaryUser.id,
        type: NotificationType.TAG_NEW_JOB,
        title: "구독 태그에 맞는 새 공고가 있습니다",
        body: `${traineeLabel.name} 태그가 붙은 ${jobs[1].title} 공고를 확인해 보세요.`,
        href: `/jobs/detail/?id=${jobs[1].id}`,
        jobId: jobs[1].id,
        labelId: traineeLabel.id,
        metadata: { source: "mock", tag: traineeLabel.name },
        dedupeKey: `mock-tag-new-job-${jobs[1].id}-${traineeLabel.id}`,
        createdAt: seedDate(0, 11),
      },
    });
  }
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
  const seededUsers = await Promise.all(
    mockUsers.map((user) =>
      prisma.user.upsert({
        where: { username: user.username },
        update: {
          passwordHash,
          displayName: user.displayName,
          role: user.role,
          profileImageUrl:
            "profileImageUrl" in user ? user.profileImageUrl : null,
        },
        create: {
          username: user.username,
          passwordHash,
          displayName: user.displayName,
          role: user.role,
          profileImageUrl:
            "profileImageUrl" in user ? user.profileImageUrl : null,
        },
      }),
    ),
  );
  const userByUsername = new Map(
    seededUsers.map((user) => [user.username, user]),
  );

  await Promise.all(
    jobSeekerMockUsers.map((user) => {
      const savedUser = userByUsername.get(user.username)!;
      return prisma.personalProfile.upsert({
        where: { userId: savedUser.id },
        update: {
          cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
          careerStage: user.careerStage,
          employmentHistoryStatus: user.employmentHistoryStatus,
          verifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
        create: {
          userId: savedUser.id,
          cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
          careerStage: user.careerStage,
          employmentHistoryStatus: user.employmentHistoryStatus,
          verifiedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      });
    }),
  );

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
      upsertCompanyBackgroundAsset(company, companyOwners[index].id, index),
    ),
  );
  await Promise.all(
    companies.map((company, index) =>
      upsertCompanyLogoAsset(company, companyOwners[index].id, index),
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
        "수습 CPA 지원 가능 공고입니다. 회계감사 보조, 재무제표 검토, 감사조서 작성, 고객 자료 요청 커뮤니케이션을 담당합니다. 입사 후 4주 온보딩과 현장 리뷰어 피드백을 제공하며 실무수습기관 요건을 충족할 수 있도록 배정합니다.",
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
        "FDD, valuation, transaction service 프로젝트를 지원할 주니어 회계사를 채용합니다. 재무제표 정규화, 운전자본 분석, 실사 Q&A 관리, 보고서 작성 보조를 맡으며 Deal 프로젝트 경험 또는 KICPA 자격을 우대합니다.",
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
        "상장사 내부회계 운영 평가, 통제 설계, 외부감사 대응 업무를 담당합니다. 프로세스별 RCM 업데이트, 설계/운영평가 문서화, 개선 과제 추적, 감사인 커뮤니케이션을 수행하며 회계 또는 내부통제 경력을 우대합니다.",
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

  await seedCommunityData(userByUsername);
  await seedBookmarksPresetsAndSubscriptions(userByUsername, labelByName);

  console.log(
    `Inserted or updated mock data: ${TARGET_COMPANY_COUNT} companies, ${TARGET_JOB_COUNT} jobs, ${TARGET_COMPANY_COUNT + mockUsers.length} users, community posts, bookmarks, presets.`,
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
