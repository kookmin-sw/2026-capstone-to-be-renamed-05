import type {
  CompanyDashboardResponse,
  CompanyDetailItem,
  CompanyListItem,
  CompanyManagedJobItem,
  CompanyProfileSubmissionItem,
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  JobCalendarResponse,
  JobDetailItem,
  JobFilterPreference,
  JobFilterPreferenceResponse,
  JobListItem,
  JobSubmissionItem,
  KicpaCondition,
  TraineeStatus,
} from "@cpa/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type JobListResponse = {
  items: JobListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CompanyListResponse = {
  items: CompanyListItem[];
  total: number;
  openTotal: number;
  noJobTotal: number;
};

export type AuthUser = {
  id: string;
  username: string;
  displayName: string | null;
  role: "JOB_SEEKER" | "COMPANY" | "ADMIN";
  companyId: string | null;
};

export type CompanyProfileSubmissionPayload = {
  name?: string;
  type?: CompanyType;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  businessNumber?: string;
  externalLinks?: string[];
  tags?: string[];
};

export type CompanyJobSubmissionPayload = {
  title: string;
  description: string;
  originalUrl: string;
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution?: boolean;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  location?: string;
  deadlineType: DeadlineType;
  deadline?: string;
};

export async function fetchJobs(params: URLSearchParams) {
  const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("공고 목록을 불러오지 못했습니다.");
  }
  return (await response.json()) as JobListResponse;
}

export async function fetchJobDetail(id: string) {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("공고 상세를 불러오지 못했습니다.");
  }
  return (await response.json()) as JobDetailItem;
}

export async function fetchJobCalendar(params: URLSearchParams) {
  const response = await fetch(
    `${API_BASE_URL}/jobs/calendar?${params.toString()}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("마감 캘린더를 불러오지 못했습니다.");
  }
  return (await response.json()) as JobCalendarResponse;
}

export async function fetchCompanies(params: URLSearchParams) {
  const response = await fetch(
    `${API_BASE_URL}/companies?${params.toString()}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("회사 목록을 불러오지 못했습니다.");
  }
  return (await response.json()) as CompanyListResponse;
}

export async function fetchCompanyDetail(id: string) {
  const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("회사 상세를 불러오지 못했습니다.");
  }
  return (await response.json()) as CompanyDetailItem;
}

export async function authRequest(
  mode: "login" | "register",
  payload: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { user?: AuthUser; message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "인증 요청에 실패했습니다.");
  }
  return data.user;
}

export async function logoutRequest() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "로그아웃에 실패했습니다."));
  }
  return (await response.json()) as { ok: boolean };
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append("companyLogo", file);

  const response = await fetch(`${API_BASE_URL}/auth/company-logo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = (await response.json()) as {
    logoUrl?: string;
    message?: string | string[];
  };
  if (!response.ok || !data.logoUrl) {
    const message = Array.isArray(data.message)
      ? data.message.join(" ")
      : data.message;
    throw new Error(message ?? "기업 이미지 업로드에 실패했습니다.");
  }
  return data.logoUrl;
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) return null;
  const data = (await response.json()) as { user?: AuthUser; message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "현재 사용자를 불러오지 못했습니다.");
  }
  return data.user ?? null;
}

export async function fetchCompanyDashboard() {
  const response = await fetch(`${API_BASE_URL}/companies/me`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "기업 정보를 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as CompanyDashboardResponse;
}

export async function submitCompanyProfile(
  payload: CompanyProfileSubmissionPayload,
) {
  const response = await fetch(
    `${API_BASE_URL}/companies/me/profile-submissions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "회사 정보 수정 요청에 실패했습니다."),
    );
  }
  return (await response.json()) as CompanyProfileSubmissionItem;
}

export async function updateCompanyLogo(logoUrl: string) {
  const response = await fetch(`${API_BASE_URL}/companies/me/logo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ logoUrl }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "기업 이미지 변경에 실패했습니다."),
    );
  }
  return (await response.json()) as CompanyDetailItem;
}

export async function submitCompanyJob(payload: CompanyJobSubmissionPayload) {
  const response = await fetch(`${API_BASE_URL}/companies/me/job-submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "채용공고 제출에 실패했습니다."),
    );
  }
  return (await response.json()) as JobSubmissionItem;
}

export async function fetchCompanyJobSubmissions() {
  const response = await fetch(`${API_BASE_URL}/companies/me/job-submissions`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 제출 이력을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as { items: JobSubmissionItem[] };
}

export async function updateCompanyJobSubmission(
  id: string,
  payload: CompanyJobSubmissionPayload,
) {
  const response = await fetch(
    `${API_BASE_URL}/companies/me/job-submissions/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 요청 수정에 실패했습니다."),
    );
  }
  return (await response.json()) as JobSubmissionItem;
}

export async function cancelCompanyJobSubmission(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/companies/me/job-submissions/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 요청 취소에 실패했습니다."),
    );
  }
  return (await response.json()) as JobSubmissionItem;
}

export async function fetchCompanyJobs() {
  const response = await fetch(`${API_BASE_URL}/companies/me/jobs`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "게시 공고 목록을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as { items: CompanyManagedJobItem[] };
}

export async function submitCompanyJobEdit(
  id: string,
  payload: CompanyJobSubmissionPayload,
) {
  const response = await fetch(
    `${API_BASE_URL}/companies/me/jobs/${id}/edit-submissions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 수정 요청에 실패했습니다."),
    );
  }
  return (await response.json()) as JobSubmissionItem;
}

export async function deleteCompanyJob(id: string) {
  const response = await fetch(`${API_BASE_URL}/companies/me/jobs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "공고 삭제에 실패했습니다."));
  }
  return (await response.json()) as CompanyManagedJobItem;
}

export async function fetchJobFilterPreference() {
  const response = await fetch(`${API_BASE_URL}/users/me/job-filter`, {
    cache: "no-store",
    credentials: "include",
  });
  if (response.status === 401) {
    throw new Error("로그인이 필요합니다.");
  }
  if (!response.ok) {
    throw new Error("저장된 필터를 불러오지 못했습니다.");
  }
  const data = (await response.json()) as JobFilterPreferenceResponse;
  return data;
}

export async function saveJobFilterPreference(filter: JobFilterPreference) {
  const response = await fetch(`${API_BASE_URL}/users/me/job-filter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ filter }),
  });
  if (response.status === 401) {
    throw new Error("로그인이 필요합니다.");
  }
  if (!response.ok) {
    throw new Error("필터를 저장하지 못했습니다.");
  }
  return (await response.json()) as JobFilterPreferenceResponse;
}

export async function fetchAdminHealth() {
  const response = await fetch(`${API_BASE_URL}/admin/health`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return (await response.json()) as { ok: boolean; area: string };
}

export async function fetchAdminJobSubmissions() {
  const response = await fetch(`${API_BASE_URL}/admin/job-submissions`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 검수 목록을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as { items: JobSubmissionItem[] };
}

export async function reviewAdminJobSubmission(
  id: string,
  action: "approve" | "reject",
  adminNote?: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/job-submissions/${id}/${action}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ adminNote }),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "공고 검수 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as JobSubmissionItem;
}

export async function fetchAdminProfileSubmissions() {
  const response = await fetch(`${API_BASE_URL}/admin/profile-submissions`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "회사 정보 검수 목록을 불러오지 못했습니다.",
      ),
    );
  }
  return (await response.json()) as { items: CompanyProfileSubmissionItem[] };
}

export async function reviewAdminProfileSubmission(
  id: string,
  action: "approve" | "reject",
  adminNote?: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/profile-submissions/${id}/${action}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ adminNote }),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "회사 정보 검수 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as CompanyProfileSubmissionItem;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(" ");
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}
