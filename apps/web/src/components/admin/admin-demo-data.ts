import { getApiBaseUrl } from "@/lib/runtime-config";

export type JobStatus = "OPEN" | "CLOSED" | "DRAFT";
export type AdminRole = "JOB_SEEKER" | "COMPANY" | "ADMIN";
export type AdminCompanyType =
  | "BIG4"
  | "LOCAL_ACCOUNTING_FIRM"
  | "MID_SMALL_ACCOUNTING_FIRM"
  | "FINANCIAL_COMPANY"
  | "GENERAL_COMPANY"
  | "PUBLIC_INSTITUTION";
export type AdminJobFamily =
  | "AUDIT"
  | "TAX"
  | "FAS"
  | "DEAL"
  | "INTERNAL_ACCOUNTING"
  | "IN_HOUSE";
export type AdminEmploymentType =
  | "FULL_TIME"
  | "CONTRACT"
  | "INTERN"
  | "PART_TIME";
export type AdminKicpaCondition = "REQUIRED" | "PREFERRED" | "NONE" | "UNCLEAR";
export type AdminTraineeStatus = "AVAILABLE" | "UNAVAILABLE" | "UNCLEAR";
export type AdminDeadlineType = "FIXED_DATE" | "UNTIL_FILLED" | "ALWAYS_OPEN";

export type AdminUser = {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  companyId: string | null;
};

export type AdminJob = {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  sourceId: string;
  sourceName: string;
  originalUrl: string;
  jobFamily: AdminJobFamily;
  employmentType: AdminEmploymentType;
  companyType: AdminCompanyType;
  kicpaCondition: AdminKicpaCondition;
  traineeStatus: AdminTraineeStatus;
  practicalTrainingInstitution: boolean | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  location: string | null;
  deadlineType: AdminDeadlineType;
  deadline: string | null;
  status: JobStatus;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCompany = {
  id: string;
  name: string;
  type: AdminCompanyType;
  websiteUrl: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  description: string | null;
  businessNumber: string | null;
  externalLinks: string[];
  tags: string[];
  employeeCount: number | null;
  averageSalary: number | null;
  foundedYear: number | null;
  recentAttritionRate: number | null;
  jobCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMember = {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  accountStatus: "ACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type AdminSource = {
  id: string;
  name: string;
  baseUrl: string | null;
  description: string | null;
};

export type AdminListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminDashboard = {
  counts: {
    jobs: number;
    companies: number;
    members: number;
    jobsByStatus: Record<JobStatus, number>;
  };
  recentJobs: AdminJob[];
  recentCompanies: AdminCompany[];
};

export type AdminJobPayload = Omit<
  AdminJob,
  | "id"
  | "companyName"
  | "sourceName"
  | "createdAt"
  | "updatedAt"
  | "lastCheckedAt"
>;

export type AdminCompanyPayload = Omit<
  AdminCompany,
  "id" | "logoUrl" | "backgroundUrl" | "jobCount" | "createdAt" | "updatedAt"
>;

type DemoState = {
  jobs: AdminJob[];
  companies: AdminCompany[];
  members: AdminMember[];
  sources: AdminSource[];
};

const stateKey = "accountit-admin-demo-state";
const sessionKey = "accountit-admin-demo-user";
const sessionUserKey = "accountit-admin-api-user";
const API_BASE_URL = getApiBaseUrl();
const demoAdminAccounts = [
  { username: "test001", password: "password123" },
] as const;

export const demoAdminCredentialText = `${demoAdminAccounts[0].username} / ${demoAdminAccounts[0].password}`;

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function apiJson<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "API request failed."));
  }
  return (await response.json()) as T;
}

function storeAdminUser(user: AdminUser) {
  window.sessionStorage.setItem(sessionKey, user.username);
  window.sessionStorage.setItem(sessionUserKey, JSON.stringify(user));
}

function clearAdminUser() {
  window.sessionStorage.removeItem(sessionKey);
  window.sessionStorage.removeItem(sessionUserKey);
}

export const companyTypeLabels: Record<string, string> = {
  BIG4: "Big4",
  LOCAL_ACCOUNTING_FIRM: "로컬 회계법인",
  MID_SMALL_ACCOUNTING_FIRM: "중소 회계법인",
  FINANCIAL_COMPANY: "금융사",
  GENERAL_COMPANY: "일반 기업",
  PUBLIC_INSTITUTION: "공공기관",
};

export const jobFamilyLabels: Record<string, string> = {
  AUDIT: "감사",
  TAX: "세무",
  FAS: "FAS",
  DEAL: "Deal",
  INTERNAL_ACCOUNTING: "내부회계",
  IN_HOUSE: "인하우스",
};

export const employmentLabels: Record<string, string> = {
  FULL_TIME: "정규직",
  CONTRACT: "계약직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
};

export const kicpaLabels: Record<string, string> = {
  REQUIRED: "KICPA 필수",
  PREFERRED: "KICPA 우대",
  NONE: "무관",
  UNCLEAR: "불명확",
};

export const traineeLabels: Record<string, string> = {
  AVAILABLE: "수습 가능",
  UNAVAILABLE: "수습 불가",
  UNCLEAR: "수습 불명확",
};

export const deadlineTypeLabels: Record<string, string> = {
  FIXED_DATE: "마감일 지정",
  UNTIL_FILLED: "채용 시 마감",
  ALWAYS_OPEN: "상시채용",
};

export const jobStatusLabels: Record<string, string> = {
  OPEN: "게시중",
  CLOSED: "마감",
  DRAFT: "숨김/임시저장",
};

export const userRoleLabels: Record<string, string> = {
  JOB_SEEKER: "개인회원",
  COMPANY: "기업회원",
  ADMIN: "관리자",
};

function nowIso() {
  return new Date().toISOString();
}

function seedState(): DemoState {
  const createdAt = "2026-05-06T00:00:00.000Z";
  const companies: AdminCompany[] = [
    {
      id: "demo-company-1",
      name: "한빛회계법인",
      type: "LOCAL_ACCOUNTING_FIRM",
      websiteUrl: "https://example.com/hanbit",
      logoUrl: "/company-logos/hanbit-accounting.png",
      backgroundUrl: "/company-backgrounds/local-accounting-firm.png",
      description: "수습 CPA와 감사 실무 포지션을 다루는 데모 회사입니다.",
      businessNumber: "104-86-45219",
      externalLinks: ["https://example.com/hanbit/careers"],
      tags: ["로컬", "감사"],
      employeeCount: 64,
      averageSalary: 6200,
      foundedYear: 2014,
      recentAttritionRate: 3.1,
      jobCount: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "demo-company-2",
      name: "두나무",
      type: "GENERAL_COMPANY",
      websiteUrl: "https://example.com/dunamu",
      logoUrl: "/company-logos/dunamu.png",
      backgroundUrl: "/company-backgrounds/general-company.png",
      description: "내부회계와 재무 리포팅 포지션을 다루는 데모 회사입니다.",
      businessNumber: "120-88-18432",
      externalLinks: ["https://example.com/dunamu/careers"],
      tags: ["인하우스", "내부회계"],
      employeeCount: 720,
      averageSalary: 8800,
      foundedYear: 2012,
      recentAttritionRate: 6.8,
      jobCount: 1,
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const sources: AdminSource[] = [
    {
      id: "demo-source-1",
      name: "KICPA 구인 게시판",
      baseUrl: null,
      description: null,
    },
    {
      id: "demo-source-2",
      name: "기업 채용 페이지",
      baseUrl: null,
      description: null,
    },
  ];
  const jobs: AdminJob[] = [
    {
      id: "demo-job-1",
      title: "수습 CPA 감사본부 채용",
      description: "회계감사 보조와 재무제표 검토 업무를 수행합니다.",
      companyId: companies[0].id,
      companyName: companies[0].name,
      sourceId: sources[0].id,
      sourceName: sources[0].name,
      originalUrl: "https://example.com/jobs/hanbit-audit-trainee",
      jobFamily: "AUDIT",
      employmentType: "FULL_TIME",
      companyType: companies[0].type,
      kicpaCondition: "PREFERRED",
      traineeStatus: "AVAILABLE",
      practicalTrainingInstitution: true,
      minExperienceYears: 0,
      maxExperienceYears: 1,
      location: "서울 중구",
      deadlineType: "FIXED_DATE",
      deadline: "2026-05-31T14:59:59.000Z",
      status: "OPEN",
      lastCheckedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "demo-job-2",
      title: "내부회계관리제도 담당자",
      description:
        "상장사 내부회계 운영 평가와 외부감사 대응 업무를 담당합니다.",
      companyId: companies[1].id,
      companyName: companies[1].name,
      sourceId: sources[1].id,
      sourceName: sources[1].name,
      originalUrl: "https://example.com/jobs/dunamu-icfr",
      jobFamily: "INTERNAL_ACCOUNTING",
      employmentType: "FULL_TIME",
      companyType: companies[1].type,
      kicpaCondition: "PREFERRED",
      traineeStatus: "UNCLEAR",
      practicalTrainingInstitution: false,
      minExperienceYears: 4,
      maxExperienceYears: 8,
      location: "서울 강남구",
      deadlineType: "UNTIL_FILLED",
      deadline: null,
      status: "DRAFT",
      lastCheckedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const members: AdminMember[] = [
    {
      id: "demo-user-1",
      username: "test001",
      displayName: "테스트 관리자",
      role: "ADMIN",
      accountStatus: "ACTIVE",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "demo-user-2",
      username: "test002",
      displayName: "테스트 개인회원",
      role: "JOB_SEEKER",
      accountStatus: "ACTIVE",
      createdAt,
      updatedAt: createdAt,
    },
  ];
  return { jobs, companies, members, sources };
}

function readState(): DemoState {
  if (typeof window === "undefined") return seedState();
  const raw = window.sessionStorage.getItem(stateKey);
  if (!raw) {
    const seeded = seedState();
    window.sessionStorage.setItem(stateKey, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as DemoState;
}

function writeState(state: DemoState) {
  window.sessionStorage.setItem(stateKey, JSON.stringify(state));
}

function paginate<T>(
  items: T[],
  params: URLSearchParams,
): AdminListResponse<T> {
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "20");
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

function enrichJobs(state: DemoState) {
  return state.jobs.map((job) => {
    const company = state.companies.find((item) => item.id === job.companyId);
    const source = state.sources.find((item) => item.id === job.sourceId);
    return {
      ...job,
      companyName: company?.name ?? job.companyName,
      sourceName: source?.name ?? job.sourceName,
      companyType: company?.type ?? job.companyType,
    };
  });
}

function recalculateCompanyCounts(state: DemoState) {
  state.companies = state.companies.map((company) => ({
    ...company,
    jobCount: state.jobs.filter((job) => job.companyId === company.id).length,
  }));
}

export function getAdminDemoUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const rawUser = window.sessionStorage.getItem(sessionUserKey);
  if (rawUser) {
    try {
      return JSON.parse(rawUser) as AdminUser;
    } catch {
      clearAdminUser();
      return null;
    }
  }
  const username = window.sessionStorage.getItem(sessionKey);
  if (!username) return null;
  return {
    id: "demo-user-1",
    username,
    displayName: "테스트 관리자",
    role: "ADMIN",
    companyId: null,
  };
}

export async function fetchAdminCurrentUser() {
  try {
    const data = await apiJson<{ user?: AdminUser }>("/auth/me");
    if (data.user?.role !== "ADMIN") {
      clearAdminUser();
      return null;
    }
    storeAdminUser(data.user);
    return data.user;
  } catch {
    clearAdminUser();
    return null;
  }
}

export async function loginAdminDemo(username: string, password: string) {
  const data = await apiJson<{ user?: AdminUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!data.user || data.user.role !== "ADMIN") {
    throw new Error(`테스트 관리자 계정은 ${demoAdminCredentialText} 입니다.`);
  }
  storeAdminUser(data.user);
  return data.user;
}

export async function logoutAdminDemo() {
  try {
    await apiJson<{ ok: boolean }>("/auth/logout", { method: "POST" });
  } finally {
    clearAdminUser();
  }
}

export async function fetchAdminDashboard() {
  return apiJson<AdminDashboard>("/admin/dashboard");
}

export async function fetchAdminSources() {
  return apiJson<{ items: AdminSource[] }>("/admin/sources");
}

export async function fetchAdminJobs(params: URLSearchParams) {
  return apiJson<AdminListResponse<AdminJob>>(
    `/admin/jobs?${params.toString()}`,
  );
}

export async function fetchAdminJob(id: string) {
  return apiJson<AdminJob>(`/admin/jobs/${id}`);
}

export async function createAdminJob(payload: AdminJobPayload) {
  return apiJson<AdminJob>("/admin/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminJob(id: string, payload: AdminJobPayload) {
  return apiJson<AdminJob>(`/admin/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminJobStatus(id: string, status: JobStatus) {
  return apiJson<AdminJob>(`/admin/jobs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminCompanies(params: URLSearchParams) {
  return apiJson<AdminListResponse<AdminCompany>>(
    `/admin/companies?${params.toString()}`,
  );
}

export async function fetchAdminCompany(id: string) {
  return apiJson<AdminCompany>(`/admin/companies/${id}`);
}

export async function createAdminCompany(payload: AdminCompanyPayload) {
  return apiJson<AdminCompany>("/admin/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCompany(
  id: string,
  payload: AdminCompanyPayload,
) {
  return apiJson<AdminCompany>(`/admin/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminMembers(params: URLSearchParams) {
  return apiJson<AdminListResponse<AdminMember>>(
    `/admin/members?${params.toString()}`,
  );
}
