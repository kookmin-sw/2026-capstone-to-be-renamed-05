export const USER_ROLES = ["JOB_SEEKER", "COMPANY", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CPA_VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "CPA_VERIFIED",
  "REJECTED",
] as const;
export type CpaVerificationStatus =
  (typeof CPA_VERIFICATION_STATUSES)[number];

export const PERSONAL_CAREER_STAGES = [
  "CPA_UNPLACED",
  "TRAINEE",
  "LICENSED_CPA",
] as const;
export type PersonalCareerStage = (typeof PERSONAL_CAREER_STAGES)[number];

export const EMPLOYMENT_HISTORY_STATUSES = [
  "UNKNOWN",
  "NONE",
  "HAS_EMPLOYMENT",
] as const;
export type EmploymentHistoryStatus =
  (typeof EMPLOYMENT_HISTORY_STATUSES)[number];

export const PERSONAL_VERIFICATION_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type PersonalVerificationRequestStatus =
  (typeof PERSONAL_VERIFICATION_REQUEST_STATUSES)[number];

export const COMMUNITY_BOARD_TYPES = [
  "CPA_PREP",
  "TRAINEE",
  "SENIOR",
  "FREE",
] as const;
export type CommunityBoardType = (typeof COMMUNITY_BOARD_TYPES)[number];

export const COMMUNITY_POST_STATUSES = [
  "QUESTION",
  "ANSWERED",
  "FREE",
  "INFO",
] as const;
export type CommunityPostStatus = (typeof COMMUNITY_POST_STATUSES)[number];

export const JOB_FAMILIES = [
  "AUDIT",
  "TAX",
  "FAS",
  "DEAL",
  "INTERNAL_ACCOUNTING",
  "IN_HOUSE",
] as const;
export type JobFamily = (typeof JOB_FAMILIES)[number];

export const COMPANY_TYPES = [
  "BIG4",
  "LOCAL_ACCOUNTING_FIRM",
  "MID_SMALL_ACCOUNTING_FIRM",
  "FINANCIAL_COMPANY",
  "GENERAL_COMPANY",
  "PUBLIC_INSTITUTION",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "CONTRACT",
  "INTERN",
  "PART_TIME",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const KICPA_CONDITIONS = [
  "REQUIRED",
  "PREFERRED",
  "NONE",
  "UNCLEAR",
] as const;
export type KicpaCondition = (typeof KICPA_CONDITIONS)[number];

export const TRAINEE_STATUSES = [
  "AVAILABLE",
  "UNAVAILABLE",
  "UNCLEAR",
] as const;
export type TraineeStatus = (typeof TRAINEE_STATUSES)[number];

export const DEADLINE_TYPES = [
  "FIXED_DATE",
  "UNTIL_FILLED",
  "ALWAYS_OPEN",
] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];

export const JOB_STATUSES = ["OPEN", "CLOSED", "DRAFT"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_PRESET_IDS = ["active-hiring", "career-verified"] as const;
export type JobPresetId = (typeof JOB_PRESET_IDS)[number];

export const CAREER_VERIFICATION_SIGNALS = [
  "BIG4",
  "PUBLIC_INSTITUTION",
  "MAJOR_ACCOUNTING_FIRM",
  "LISTED",
  "CONGLOMERATE",
  "PUBLIC_EQUIVALENT",
] as const;
export type CareerVerificationSignal =
  (typeof CAREER_VERIFICATION_SIGNALS)[number];

export type ActiveHiringPresetConfig = {
  id: "active-hiring";
  label: string;
  description: string;
  resolver: "company-open-job-count";
  criteria: { minOpenJobs: number };
};

export type CareerVerifiedPresetConfig = {
  id: "career-verified";
  label: string;
  description: string;
  resolver: "company-career-verification";
  criteria: { signals: readonly CareerVerificationSignal[] };
};

export type JobPresetConfig =
  | ActiveHiringPresetConfig
  | CareerVerifiedPresetConfig;

export const jobPresetConfigs = [
  {
    id: "active-hiring",
    label: "적극 채용 중",
    description: "회사 단위로 활성 공고가 많은 채용 신호를 봅니다.",
    resolver: "company-open-job-count",
    criteria: { minOpenJobs: 5 },
  },
  {
    id: "career-verified",
    label: "커리어 검증 기업",
    description: "명시된 회사 metadata로 설명 가능한 기업만 봅니다.",
    resolver: "company-career-verification",
    criteria: {
      signals: [
        "BIG4",
        "PUBLIC_INSTITUTION",
        "MAJOR_ACCOUNTING_FIRM",
        "LISTED",
        "CONGLOMERATE",
        "PUBLIC_EQUIVALENT",
      ],
    },
  },
] as const satisfies readonly JobPresetConfig[];

export const SUBMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_TYPES = ["CREATE", "UPDATE"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const AI_SUGGESTION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type AiSuggestionStatus = (typeof AI_SUGGESTION_STATUSES)[number];

export type JobListItem = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyBackgroundUrl: string | null;
  companyType: CompanyType;
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution: boolean | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  location: string | null;
  deadlineType: DeadlineType;
  deadline: string | null;
  dDay: number | null;
  sourceName: string;
  originalUrl: string;
  createdAt: string;
  lastCheckedAt: string;
  labels: string[];
};

export type JobAiSuggestion = {
  id: string;
  summary: string;
  tags: string[];
  risks: string[];
  status: AiSuggestionStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobDetailItem = JobListItem & {
  description: string;
  aiSuggestion: JobAiSuggestion | null;
};

export type JobCalendarItem = JobListItem;

export type JobCalendarEventType = "START" | "DEADLINE";

export type JobCalendarEvent = {
  date: string;
  type: JobCalendarEventType;
  job: JobCalendarItem;
};

export type JobCalendarRange = {
  startDate: string;
  endDate: string | null;
  job: JobCalendarItem;
};

export type JobCalendarDay = {
  date: string;
  total: number;
  jobs: JobCalendarItem[];
};

export type JobCalendarResponse = {
  from: string;
  to: string;
  days: JobCalendarDay[];
  events: JobCalendarEvent[];
  ranges: JobCalendarRange[];
};

export type JobFilterPreference = {
  search?: string;
  jobFamily?: string;
  companyType?: string;
  traineeStatus?: string;
  selectedLocations?: string[];
  employmentType?: string;
  kicpaCondition?: string;
  deadlineType?: string;
  practicalTrainingInstitution?: string;
  deadlineWithinDays?: string;
  careerLevel?: string;
  minExperienceYears?: string;
  maxExperienceYears?: string;
  minCompanyAgeYears?: string;
  maxCompanyAgeYears?: string;
  maxAttritionRate?: string;
  sort?: string;
};

export type JobFilterPreferenceResponse = {
  filter: JobFilterPreference | null;
  authenticated: boolean;
};

export type UserJobPresetItem = {
  id: string;
  filterState: JobFilterPreference;
  autoLabel: string;
  filterSignature: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type UserJobPresetListResponse = {
  items: UserJobPresetItem[];
  authenticated: boolean;
};

export type EmployeeTrendPoint = {
  month: string;
  joined: number;
  left: number;
  total: number;
};

export type CompanyListItem = {
  id: string;
  name: string;
  type: CompanyType;
  websiteUrl: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  description: string | null;
  tags: string[];
  employeeCount: number | null;
  averageSalary: number | null;
  foundedYear: number | null;
  recentAttritionRate: number | null;
  openJobCount: number;
};

export type CompanyDetailItem = CompanyListItem & {
  businessNumber: string | null;
  externalLinks: string[];
  employeeTrend: EmployeeTrendPoint[];
  openJobs: JobListItem[];
};

export type CompanyProfileProposal = {
  name?: string;
  type?: CompanyType;
  websiteUrl?: string | null;
  description?: string | null;
  businessNumber?: string | null;
  externalLinks?: string[];
  tags?: string[];
};

export type CompanyProfileSubmissionItem = {
  id: string;
  companyId: string;
  companyName: string;
  proposed: CompanyProfileProposal;
  status: SubmissionStatus;
  adminNote: string | null;
  submittedByUsername: string;
  reviewedByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export type JobSubmissionItem = {
  id: string;
  companyId: string;
  companyName: string;
  submissionType: SubmissionType;
  targetJobId: string | null;
  targetJobTitle: string | null;
  title: string;
  description: string;
  originalUrl: string | null;
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution: boolean | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  location: string | null;
  deadlineType: DeadlineType;
  deadline: string | null;
  status: SubmissionStatus;
  adminNote: string | null;
  approvedJobId: string | null;
  submittedByUsername: string;
  reviewedByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export type CompanyManagedJobItem = JobListItem & {
  description: string;
  status: JobStatus;
  pendingEditSubmission: JobSubmissionItem | null;
};

export type CompanyDashboardResponse = {
  company: CompanyDetailItem;
  pendingProfileSubmission: CompanyProfileSubmissionItem | null;
};

// ─── Mypage ──────────────────────────────────────────────────

export const BOOKMARK_TARGET_TYPES = ["JOB", "COMPANY"] as const;
export type BookmarkTargetType = (typeof BOOKMARK_TARGET_TYPES)[number];

export type BookmarkItem = {
  id: string;
  targetType: BookmarkTargetType;
  targetId: string;
  targetTitle: string;
  targetSubtitle: string | null;
  createdAt: string;
};

export type BookmarkListResponse = {
  items: BookmarkItem[];
};

export type ResumeItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  updatedAt: string;
};

export type ResumeListResponse = {
  items: ResumeItem[];
};

export type MyProfileResponse = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  cpaVerificationStatus: CpaVerificationStatus;
  careerStage: PersonalCareerStage | null;
  employmentHistoryStatus: EmploymentHistoryStatus;
  verifiedAt: string | null;
  traineeRoomAccess: boolean;
  pendingVerificationRequest: PersonalVerificationRequestItem | null;
};

export type UpdateProfilePayload = {
  displayName?: string;
};

export type PersonalVerificationRequestItem = {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  applicantName: string;
  birthDate: string | null;
  registrationNumber: string | null;
  registrationNumberLast4: string | null;
  requestedCareerStage: PersonalCareerStage;
  status: PersonalVerificationRequestStatus;
  adminNote: string | null;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonalVerificationRequestListResponse = {
  items: PersonalVerificationRequestItem[];
};

export type CreatePersonalVerificationRequestPayload = {
  applicantName: string;
  birthDate: string;
  registrationNumber: string;
  requestedCareerStage: PersonalCareerStage;
};

export type ReviewPersonalVerificationRequestPayload = {
  adminNote?: string;
};

export type CommunityPostItem = {
  id: string;
  boardType: CommunityBoardType;
  title: string;
  content: string;
  status: CommunityPostStatus;
  tags: string[];
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isResolved: boolean;
  acceptedAnswerId: string | null;
};

export type CommunityAnswerItem = {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  isAccepted: boolean;
};

export type CommunityPostListResponse = {
  items: CommunityPostItem[];
};

export type CommunityPostDetailResponse = {
  post: CommunityPostItem;
  answers: CommunityAnswerItem[];
};

export type CreateCommunityPostPayload = {
  boardType: CommunityBoardType;
  title: string;
  content: string;
  tags?: string[];
  isAnonymous?: boolean;
};

export type CreateCommunityAnswerPayload = {
  content: string;
  isAnonymous?: boolean;
};
