import type {
  BookmarkItem,
  BookmarkListResponse,
  BookmarkTargetType,
  CompanyDashboardResponse,
  CompanyDetailItem,
  CompanyListItem,
  CompanyManagedJobItem,
  CompanyProfileSubmissionItem,
  CompanyType,
  CommunityAnswerItem,
  CommunityBoardType,
  CommunityPostDetailResponse,
  CommunityPostItem,
  CommunityPostListResponse,
  CreateCommunityAnswerPayload,
  CreateCommunityPostPayload,
  CreatePersonalVerificationRequestPayload,
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
  MyProfileResponse,
  MyCommunityActivityListResponse,
  NotificationItem,
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationUnreadCountResponse,
  PersonalVerificationRequestItem,
  PersonalVerificationRequestListResponse,
  ReviewPersonalVerificationRequestPayload,
  ResumeItem,
  ResumeListResponse,
  TagSubscriptionItem,
  TagSubscriptionListResponse,
  TraineeStatus,
  UserJobPresetItem,
  UserJobPresetListResponse,
} from "@cpa/shared";
import { getApiBaseUrl } from "./runtime-config";

const API_BASE_URL = getApiBaseUrl();
export const AUTH_USER_CHANGED_EVENT = "accountit:auth-user-changed";
export const NOTIFICATIONS_CHANGED_EVENT = "cpa:notifications-changed";

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
  profileImageUrl: string | null;
  role: "JOB_SEEKER" | "COMPANY" | "ADMIN";
  companyId: string | null;
};

export type CompanyProfileSubmissionPayload = {
  name?: string;
  type?: CompanyType;
  websiteUrl?: string;
  description?: string;
  businessNumber?: string;
  externalLinks?: string[];
  tags?: string[];
};

type CompanyLogoUploadUrlResponse = {
  assetId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  publicUrl: string;
  expiresIn: number;
  requiresCredentials?: boolean;
};

type CompanyLogoAssetResponse = {
  asset: {
    id: string;
    publicUrl: string;
  };
};

type CompanyBackgroundUploadUrlResponse = CompanyLogoUploadUrlResponse;
type CompanyBackgroundAssetResponse = CompanyLogoAssetResponse;
type ProfileImageUploadUrlResponse = CompanyLogoUploadUrlResponse;
type ProfileImageAssetResponse = CompanyLogoAssetResponse;

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
  const uploadUrlResponse = await fetch(
    `${API_BASE_URL}/assets/company-logo/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
      }),
    },
  );
  const uploadUrlData =
    (await uploadUrlResponse.json()) as CompanyLogoUploadUrlResponse & {
      message?: string | string[];
    };
  if (!uploadUrlResponse.ok || !uploadUrlData.uploadUrl) {
    throw new Error(
      readMessage(
        uploadUrlData.message,
        "기업 이미지 업로드 URL 생성에 실패했습니다.",
      ),
    );
  }

  const s3Response = await fetch(uploadUrlData.uploadUrl, {
    method: uploadUrlData.method,
    headers: uploadUrlData.headers,
    credentials: uploadUrlData.requiresCredentials ? "include" : "omit",
    body: file,
  });
  if (!s3Response.ok) {
    throw new Error("기업 이미지를 업로드하지 못했습니다.");
  }

  const completeResponse = await fetch(
    `${API_BASE_URL}/assets/${uploadUrlData.assetId}/complete`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  const completeData = (await completeResponse.json()) as
    | CompanyLogoAssetResponse
    | { message?: string | string[] };
  if (!completeResponse.ok) {
    const errorData = completeData as { message?: string | string[] };
    throw new Error(
      readMessage(errorData.message, "기업 이미지 업로드 확인에 실패했습니다."),
    );
  }
  if (!("asset" in completeData)) {
    throw new Error("기업 이미지 업로드 확인에 실패했습니다.");
  }

  return {
    assetId: completeData.asset.id,
    publicUrl: completeData.asset.publicUrl,
  };
}

export async function uploadCompanyBackground(file: File) {
  const uploadUrlResponse = await fetch(
    `${API_BASE_URL}/assets/company-background/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
      }),
    },
  );
  const uploadUrlData =
    (await uploadUrlResponse.json()) as CompanyBackgroundUploadUrlResponse & {
      message?: string | string[];
    };
  if (!uploadUrlResponse.ok || !uploadUrlData.uploadUrl) {
    throw new Error(
      readMessage(
        uploadUrlData.message,
        "기업 배경 이미지 업로드 URL 생성에 실패했습니다.",
      ),
    );
  }

  const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
    method: uploadUrlData.method,
    headers: uploadUrlData.headers,
    credentials: uploadUrlData.requiresCredentials ? "include" : "omit",
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("기업 배경 이미지를 업로드하지 못했습니다.");
  }

  const completeResponse = await fetch(
    `${API_BASE_URL}/assets/${uploadUrlData.assetId}/complete`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  const completeData = (await completeResponse.json()) as
    | CompanyBackgroundAssetResponse
    | { message?: string | string[] };
  if (!completeResponse.ok) {
    const errorData = completeData as { message?: string | string[] };
    throw new Error(
      readMessage(
        errorData.message,
        "기업 배경 이미지 업로드 확인에 실패했습니다.",
      ),
    );
  }
  if (!("asset" in completeData)) {
    throw new Error("기업 배경 이미지 업로드 확인에 실패했습니다.");
  }

  return {
    assetId: completeData.asset.id,
    publicUrl: completeData.asset.publicUrl,
  };
}

export async function uploadMyProfileImage(file: File) {
  const uploadUrlResponse = await fetch(
    `${API_BASE_URL}/assets/profile-image/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
      }),
    },
  );
  const uploadUrlData =
    (await uploadUrlResponse.json()) as ProfileImageUploadUrlResponse & {
      message?: string | string[];
    };
  if (!uploadUrlResponse.ok || !uploadUrlData.uploadUrl) {
    throw new Error(
      readMessage(
        uploadUrlData.message,
        "프로필 사진 업로드 URL 생성에 실패했습니다.",
      ),
    );
  }

  const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
    method: uploadUrlData.method,
    headers: uploadUrlData.headers,
    credentials: uploadUrlData.requiresCredentials ? "include" : "omit",
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("프로필 사진을 업로드하지 못했습니다.");
  }

  const completeResponse = await fetch(
    `${API_BASE_URL}/assets/${uploadUrlData.assetId}/complete`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  const completeData = (await completeResponse.json()) as
    | ProfileImageAssetResponse
    | { message?: string | string[] };
  if (!completeResponse.ok) {
    const errorData = completeData as { message?: string | string[] };
    throw new Error(
      readMessage(
        errorData.message,
        "프로필 사진 업로드 확인에 실패했습니다.",
      ),
    );
  }
  if (!("asset" in completeData)) {
    throw new Error("프로필 사진 업로드 확인에 실패했습니다.");
  }

  return {
    assetId: completeData.asset.id,
    publicUrl: completeData.asset.publicUrl,
  };
}

export async function updateCompanyLogo(logoAssetId: string) {
  const response = await fetch(`${API_BASE_URL}/companies/me/logo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ logoAssetId }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "기업 이미지 변경에 실패했습니다."),
    );
  }
  return (await response.json()) as CompanyDetailItem;
}

export async function updateCompanyBackground(backgroundAssetId: string) {
  const response = await fetch(`${API_BASE_URL}/companies/me/background`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ backgroundAssetId }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "기업 배경 이미지 변경에 실패했습니다."),
    );
  }
  return (await response.json()) as CompanyDetailItem;
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

export async function fetchCommunityPosts(
  options: {
    board?: CommunityBoardType;
    search?: string;
    sort?: "latest" | "popular";
    mine?: boolean;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.board) params.set("board", options.board);
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.sort) params.set("sort", options.sort);
  if (options.mine) params.set("mine", "true");
  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/community/posts${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "커뮤니티 게시글을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as CommunityPostListResponse;
}

export async function fetchCommunityPost(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/community/posts/${encodeURIComponent(id)}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "커뮤니티 게시글을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as CommunityPostDetailResponse;
}

export async function createCommunityPost(payload: CreateCommunityPostPayload) {
  const response = await fetch(`${API_BASE_URL}/community/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "커뮤니티 게시글을 등록하지 못했습니다."),
    );
  }
  return (await response.json()) as CommunityPostItem;
}

export async function createCommunityAnswer(
  postId: string,
  payload: CreateCommunityAnswerPayload,
) {
  const response = await fetch(
    `${API_BASE_URL}/community/posts/${encodeURIComponent(postId)}/answers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "답변을 등록하지 못했습니다."),
    );
  }
  return (await response.json()) as CommunityAnswerItem;
}

export async function likeCommunityPost(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/community/posts/${encodeURIComponent(id)}/like`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "좋아요 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as CommunityPostItem;
}

export async function likeCommunityAnswer(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/community/answers/${encodeURIComponent(id)}/like`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "좋아요 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as CommunityAnswerItem;
}

export async function resolveCommunityPost(id: string, answerId: string) {
  const response = await fetch(
    `${API_BASE_URL}/community/posts/${encodeURIComponent(id)}/resolve`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ answerId }),
    },
  );
  if (!response.ok) {
    throw new Error(await readApiError(response, "답변 채택에 실패했습니다."));
  }
  return (await response.json()) as CommunityPostDetailResponse;
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

export async function fetchUserJobPresets() {
  const response = await fetch(`${API_BASE_URL}/users/me/job-presets`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "개인 프리셋을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as UserJobPresetListResponse;
}

export async function createUserJobPreset(
  filter: JobFilterPreference,
  name?: string,
) {
  const response = await fetch(`${API_BASE_URL}/users/me/job-presets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ filter, name }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "개인 프리셋을 저장하지 못했습니다."),
    );
  }
  return (await response.json()) as UserJobPresetItem;
}

export async function markUserJobPresetUsed(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/me/job-presets/${id}/use`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "개인 프리셋 사용 기록을 저장하지 못했습니다.",
      ),
    );
  }
  return (await response.json()) as UserJobPresetItem;
}

export async function deleteUserJobPreset(id: string) {
  const response = await fetch(`${API_BASE_URL}/users/me/job-presets/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "개인 프리셋을 삭제하지 못했습니다."),
    );
  }
  return (await response.json()) as UserJobPresetItem;
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

export async function fetchAdminCpaVerificationRequests() {
  const response = await fetch(
    `${API_BASE_URL}/admin/cpa-verification-requests`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "CPA 검증 요청을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as PersonalVerificationRequestListResponse;
}

export async function reviewAdminCpaVerificationRequest(
  id: string,
  action: "approve" | "reject",
  payload: ReviewPersonalVerificationRequestPayload = {},
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/cpa-verification-requests/${id}/${action}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "CPA 검증 요청 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as PersonalVerificationRequestItem;
}

export type AdminAiSuggestion = {
  id: string;
  jobId: string;
  jobTitle: string;
  summary: string;
  tags: string[];
  risks: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export async function refreshAdminJobCheckedAt(id: string) {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}/refresh`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "최종 확인 시각 업데이트에 실패했습니다."),
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

export async function fetchAdminAiSuggestions() {
  const response = await fetch(`${API_BASE_URL}/admin/ai-suggestions`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "AI 제안 목록을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as { items: AdminAiSuggestion[] };
}

export async function reviewAdminAiSuggestion(
  id: string,
  action: "approve" | "reject",
) {
  const response = await fetch(
    `${API_BASE_URL}/admin/ai-suggestions/${id}/${action}`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "AI 제안 검수 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as AdminAiSuggestion;
}

// ─── Notifications ──────────────────────────────────────────

export async function fetchNotifications(
  options: {
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.unreadOnly) params.set("unreadOnly", "true");
  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/notifications${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "알림을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as NotificationListResponse;
}

export async function fetchNotificationUnreadCount() {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    return { unreadCount: 0 } satisfies NotificationUnreadCountResponse;
  }
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "알림 개수를 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as NotificationUnreadCountResponse;
}

export async function markNotificationRead(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "알림 읽음 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as NotificationItem;
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "알림 전체 읽음 처리에 실패했습니다."),
    );
  }
  return (await response.json()) as NotificationReadAllResponse;
}

export async function fetchTagSubscriptions() {
  const response = await fetch(`${API_BASE_URL}/notifications/tag-subscriptions`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "태그 구독 목록을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as TagSubscriptionListResponse;
}

export async function subscribeTag(labelId: string) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/tag-subscriptions/${encodeURIComponent(labelId)}`,
    {
      method: "PUT",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "태그 구독에 실패했습니다."),
    );
  }
  return (await response.json()) as TagSubscriptionItem;
}

export async function unsubscribeTag(labelId: string) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/tag-subscriptions/${encodeURIComponent(labelId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "태그 구독 해제에 실패했습니다."),
    );
  }
  return (await response.json()) as { ok: boolean };
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    return readMessage(data.message, fallback);
  } catch {
    return fallback;
  }
}

function readMessage(message: string | string[] | undefined, fallback: string) {
  if (Array.isArray(message)) return message.join(" ");
  return message ?? fallback;
}

// ─── Mypage ──────────────────────────────────────────────────

export async function fetchMyProfile() {
  const response = await fetch(`${API_BASE_URL}/mypage/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "프로필을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as MyProfileResponse;
}

export async function updateMyProfile(data: {
  displayName?: string;
  profileImageAssetId?: string;
  profileImageUrl?: string | null;
}) {
  const response = await fetch(`${API_BASE_URL}/mypage/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "프로필 수정에 실패했습니다."),
    );
  }
  return (await response.json()) as MyProfileResponse;
}

export async function deleteMyProfileImage() {
  const response = await fetch(`${API_BASE_URL}/mypage/profile/image`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "프로필 사진 삭제에 실패했습니다."),
    );
  }
  return (await response.json()) as MyProfileResponse;
}

export async function updateMyPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await fetch(`${API_BASE_URL}/mypage/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "비밀번호 변경에 실패했습니다."),
    );
  }
  return (await response.json()) as { ok: boolean };
}

type MyCommunityActivityOptions =
  | number
  | {
      take?: number;
      page?: number;
      pageSize?: number;
    };

export async function fetchMyCommunityActivity(
  options: MyCommunityActivityOptions = 20,
) {
  const params = new URLSearchParams();
  if (typeof options === "number") {
    params.set("take", String(options));
  } else {
    if (options.take !== undefined) params.set("take", String(options.take));
    if (options.page !== undefined) params.set("page", String(options.page));
    if (options.pageSize !== undefined) {
      params.set("pageSize", String(options.pageSize));
    }
  }
  const response = await fetch(
    `${API_BASE_URL}/mypage/community-activity?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "커뮤니티 활동을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as MyCommunityActivityListResponse;
}

export async function submitMyCpaVerificationRequest(
  payload: CreatePersonalVerificationRequestPayload,
) {
  const response = await fetch(
    `${API_BASE_URL}/mypage/cpa-verification-requests`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "CPA 검증 요청을 제출하지 못했습니다."),
    );
  }
  return (await response.json()) as PersonalVerificationRequestItem;
}

export async function fetchMyBookmarks(type?: BookmarkTargetType) {
  const params = type ? `?type=${type}` : "";
  const response = await fetch(`${API_BASE_URL}/mypage/bookmarks${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "북마크를 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as BookmarkListResponse;
}

export async function createMyBookmark(
  targetType: BookmarkTargetType,
  targetId: string,
) {
  const response = await fetch(`${API_BASE_URL}/mypage/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ targetType, targetId }),
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "북마크 추가에 실패했습니다."),
    );
  }
  return (await response.json()) as BookmarkItem;
}

export async function deleteMyBookmark(id: string) {
  const response = await fetch(`${API_BASE_URL}/mypage/bookmarks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "북마크 삭제에 실패했습니다."),
    );
  }
  return (await response.json()) as { ok: boolean };
}

export async function fetchMyResumes() {
  const response = await fetch(`${API_BASE_URL}/mypage/resumes`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "이력서를 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as ResumeListResponse;
}

export async function uploadMyResume(file: File) {
  const response = await fetch(`${API_BASE_URL}/mypage/resumes`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    },
    credentials: "include",
    body: file,
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "이력서 업로드에 실패했습니다."),
    );
  }
  return (await response.json()) as ResumeItem;
}

export function getMyResumeDownloadUrl(id: string) {
  return `${API_BASE_URL}/mypage/resumes/${encodeURIComponent(id)}/download`;
}

export async function deleteMyResume(id: string) {
  const response = await fetch(`${API_BASE_URL}/mypage/resumes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "이력서 삭제에 실패했습니다."),
    );
  }
  return (await response.json()) as { ok: boolean };
}
