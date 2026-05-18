"use client";

import type {
  JobDetailItem,
  JobFitAnalysisItem,
  ResumeItem,
} from "@cpa/shared";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  ScrollText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type ReactNode,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChipGroup } from "./_components/chip-group";
import {
  formatDeadlineDisplay,
  formatExperience,
  formatTrainingInstitution,
} from "./_lib/job-detail-utils";
import { SiteNav } from "@/components/site-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InfoItem } from "@/components/ui/info-item";
import {
  ActionButton,
  ActionLink,
  actionButtonClassName,
} from "@/components/ui/action-button";
import {
  createMyJobFitAnalysis,
  fetchCurrentUser,
  fetchJobDetail,
  fetchMyJobFitAnalyses,
  fetchMyResumes,
  recordJobEngagement,
  type AuthUser,
} from "@/lib/api";
import {
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { companyDetailHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import styles from "./job-detail.module.css";

const MYPAGE_RESUME_SECTION_HREF = "/mypage?section=resume#resume-section";
const fitInsightToneClassNames = {
  strength: {
    card: "border-t-green-500",
    title: "text-green-700",
  },
  priority: {
    card: "border-t-[var(--brand)]",
    title: "text-[var(--brand)]",
  },
  gap: {
    card: "border-t-amber-500",
    title: "text-amber-700",
  },
};
const fitReportToneClassNames = {
  High: {
    accent: "bg-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    ring: "#16a34a",
    text: "text-green-700",
  },
  Mid: {
    accent: "bg-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    ring: "#0f766e",
    text: "text-teal-700",
  },
  Watch: {
    accent: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    ring: "#f59e0b",
    text: "text-amber-700",
  },
  Low: {
    accent: "bg-[var(--brand)]",
    bg: "bg-pink-50",
    border: "border-pink-200",
    ring: "var(--brand)",
    text: "text-[var(--brand)]",
  },
};

export function JobDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [job, setJob] = useState<JobDetailItem | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [analysisItems, setAnalysisItems] = useState<JobFitAnalysisItem[]>([]);
  const [displayedAnalysis, setDisplayedAnalysis] =
    useState<JobFitAnalysisItem | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const recordedDetailJobId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const jobId = id;
    let ignore = false;
    async function load() {
      try {
        const [jobData, user] = await Promise.all([
          fetchJobDetail(jobId),
          fetchCurrentUser(),
        ]);

        if (ignore) return;

        setJob(jobData);
        setCurrentUser(user ?? null);
        setError("");
        if (recordedDetailJobId.current !== jobData.id) {
          recordedDetailJobId.current = jobData.id;
          void recordJobEngagement(jobData.id, "DETAIL_VIEW").catch(() => {});
        }

        if (user?.role === "JOB_SEEKER") {
          const [resumeResult, analysisResult] = await Promise.allSettled([
            fetchMyResumes(),
            fetchMyJobFitAnalyses(jobId),
          ]);

          if (ignore) return;

          const resumeItems =
            resumeResult.status === "fulfilled" ? resumeResult.value.items : [];
          const fetchedAnalysisItems =
            analysisResult.status === "fulfilled"
              ? analysisResult.value.items
              : [];
          setResumes(resumeItems);
          setAnalysisItems(fetchedAnalysisItems);
          setDisplayedAnalysis(fetchedAnalysisItems[0] ?? null);
          setSelectedResumeId(
            (prev) =>
              prev ||
              fetchedAnalysisItems[0]?.resumeId ||
              resumeItems.find((resume) => resume.isPrimary)?.id ||
              resumeItems[0]?.id ||
              "",
          );
        }
      } catch (caught) {
        if (!ignore) {
          setError(
            caught instanceof Error
              ? caught.message
              : "공고 상세를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (!id) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.body}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700"
            >
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">
              공고를 찾을 수 없습니다.
            </h1>
            <p className="mt-1 text-sm text-red-700">
              공고 ID가 누락되었습니다.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.body}>
          <div className="animate-pulse rounded-xl border border-[var(--app-line)] bg-white p-5 text-sm text-[var(--app-muted)]">
            공고 상세를 불러오는 중입니다.
          </div>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.body}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700"
            >
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">
              공고를 찾을 수 없습니다.
            </h1>
            <p className="mt-1 text-sm text-red-700">
              {error || "요청한 공고가 없거나 더 이상 공개되지 않았습니다."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  async function handleAnalyze() {
    if (!job || !selectedResumeId || analysisLoading) return;
    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const existingAnalysis = analysisItems.find(
        (item) => item.resumeId === selectedResumeId,
      );
      const result = await createMyJobFitAnalysis({
        jobId: job.id,
        resumeId: selectedResumeId,
        refresh: Boolean(existingAnalysis),
      });
      setAnalysisItems((prev) => [
        result.item,
        ...prev.filter((item) => item.id !== result.item.id),
      ]);
      setDisplayedAnalysis(result.item);
    } catch (caught) {
      setAnalysisError(
        caught instanceof Error
          ? caught.message
          : "AI 적합도 분석을 생성하지 못했습니다.",
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  function handleResumeChange(resumeId: string) {
    setSelectedResumeId(resumeId);
    setAnalysisError("");
    setDisplayedAnalysis(
      analysisItems.find((item) => item.resumeId === resumeId) ?? null,
    );
  }

  return (
    <JobDetail
      job={job}
      currentUser={currentUser}
      resumes={resumes}
      selectedResumeId={selectedResumeId}
      onResumeChange={handleResumeChange}
      onAnalyze={handleAnalyze}
      analysisLoading={analysisLoading}
      analysisError={analysisError}
      displayedAnalysis={displayedAnalysis}
    />
  );
}

function JobFitAnalysisPanel({
  job,
  currentUser,
  resumes,
  selectedResumeId,
  onResumeChange,
  onAnalyze,
  analysisLoading,
  analysisError,
  displayedAnalysis,
}: {
  job: JobDetailItem;
  currentUser: AuthUser | null;
  resumes: ResumeItem[];
  selectedResumeId: string;
  onResumeChange: (resumeId: string) => void;
  onAnalyze: () => void;
  analysisLoading: boolean;
  analysisError: string;
  displayedAnalysis: JobFitAnalysisItem | null;
}) {
  const selectedAnalysis =
    displayedAnalysis?.resumeId === selectedResumeId ? displayedAnalysis : null;
  const loginHref = `/login?next=${encodeURIComponent(`/jobs/detail?id=${job.id}`)}`;
  const fitVerdict = selectedAnalysis
    ? getFitVerdict(selectedAnalysis.fitScore)
    : null;
  const fitTone = selectedAnalysis
    ? getFitTone(selectedAnalysis.fitScore)
    : "Low";
  const fitToneClasses = fitReportToneClassNames[fitTone];
  const scoreMeterStyle = selectedAnalysis
    ? ({
        width: `${clampFitScore(selectedAnalysis.fitScore)}%`,
      } as CSSProperties)
    : undefined;
  const scoreRingStyle = selectedAnalysis
    ? ({
        background: `conic-gradient(${fitToneClasses.ring} ${clampFitScore(
          selectedAnalysis.fitScore,
        )}%, rgba(226, 232, 240, 0.95) 0)`,
        WebkitMask:
          "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
        mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
      } as CSSProperties)
    : undefined;
  const actionItems = selectedAnalysis
    ? buildDetailedActionItems(selectedAnalysis, job)
    : [];

  if (!currentUser) {
    return (
      <section className={styles.fitAnalysisPanel}>
        <div className={styles.fitAnalysisIntro}>
          <span className={styles.fitEyebrow}>
            <Sparkles size={14} />
            AI 적합도 분석
          </span>
          <h2>내 이력서로 이 공고의 합격 가능성을 확인하세요</h2>
          <p>
            로그인하면 업로드한 이력서와 공고 조건을 연결해 강점과 보완점을 볼
            수 있습니다.
          </p>
        </div>
        <ActionLink
          href={loginHref}
          size="sm"
          iconStart={<Sparkles size={14} />}
        >
          로그인 후 분석
        </ActionLink>
      </section>
    );
  }

  if (currentUser.role !== "JOB_SEEKER") {
    return (
      <section className={styles.fitAnalysisPanel}>
        <div className={styles.fitAnalysisIntro}>
          <span className={styles.fitEyebrow}>
            <Sparkles size={14} />
            AI 적합도 분석
          </span>
          <h2>개인회원 전용 분석</h2>
          <p>이력서 기반 공고 분석은 개인회원 계정에서 사용할 수 있습니다.</p>
        </div>
      </section>
    );
  }

  if (!resumes.length) {
    return (
      <section className={styles.fitAnalysisPanel}>
        <div className={styles.fitAnalysisIntro}>
          <span className={styles.fitEyebrow}>
            <Sparkles size={14} />
            AI 적합도 분석
          </span>
          <h2>이력서를 등록하면 바로 분석할 수 있습니다</h2>
          <p>
            마이페이지에 최대 5개의 이력서를 등록하고 공고별 적합도를
            비교해보세요.
          </p>
        </div>
        <ActionLink
          href={MYPAGE_RESUME_SECTION_HREF}
          size="sm"
          iconStart={<FileText size={14} />}
        >
          이력서 등록
        </ActionLink>
      </section>
    );
  }

  return (
    <section className={styles.fitAnalysisPanel}>
      <div className={styles.fitAnalysisHeader}>
        <div className={styles.fitAnalysisIntro}>
          <span className={styles.fitEyebrow}>
            <Sparkles size={14} />
            AI 적합도 분석
          </span>
          <h2>선택한 이력서로 이 공고를 분석합니다</h2>
          <p>
            공고 조건과 이력서 포지션을 비교해 강점, 기업 우선순위, 감점 요인을
            정리합니다.
          </p>
        </div>
        <div className={styles.fitControlRow}>
          <select
            className={styles.resumeSelect}
            value={selectedResumeId}
            onChange={(event) => onResumeChange(event.target.value)}
            aria-label="분석할 이력서 선택"
          >
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.fileName}
              </option>
            ))}
          </select>
          <ActionButton
            type="button"
            size="sm"
            iconStart={<Sparkles size={14} />}
            onClick={onAnalyze}
            disabled={analysisLoading || !selectedResumeId}
          >
            {analysisLoading
              ? "분석 중"
              : selectedAnalysis
                ? "다시 확인"
                : "결과 확인"}
          </ActionButton>
        </div>
      </div>

      {analysisError && <div className={styles.fitError}>{analysisError}</div>}

      {analysisLoading ? (
        <div className={styles.fitEmptyState}>
          이력서와 공고 조건을 비교하는 중입니다.
        </div>
      ) : selectedAnalysis ? (
        <div className="grid gap-3">
          <div className="grid gap-y-3 md:grid-cols-[120px_minmax(0,1fr)] md:gap-x-8">
            <div className="grid h-full min-h-[84px] place-items-center p-2 text-center">
              <div
                className="relative grid size-[116px] place-items-center rounded-full"
                aria-label={`AI 적합도 ${selectedAnalysis.fitScore}%`}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={scoreRingStyle}
                  aria-hidden="true"
                />
                <div className="relative grid place-items-center gap-0.5">
                  <span className="text-[11px] font-black text-gray-600">
                    AI 적합도
                  </span>
                  <strong
                    className={cn(
                      "text-[34px] font-black leading-none tracking-normal",
                      fitToneClasses.text,
                    )}
                  >
                    {selectedAnalysis.fitScore}%
                  </strong>
                </div>
              </div>
            </div>
            <div className="grid content-center gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-gray-500">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    fitToneClasses.text,
                  )}
                >
                  <Sparkles size={14} />
                  AI 판정
                </span>
                <time dateTime={selectedAnalysis.createdAt}>
                  {formatShortDate(selectedAnalysis.createdAt)} 분석
                </time>
              </div>
              <h3 className="text-base font-black leading-snug text-gray-950">
                {fitVerdict?.headline}
              </h3>
              <p className="text-sm font-semibold leading-6 text-gray-700">
                {selectedAnalysis.summary}
              </p>
              <div
                className="h-2 overflow-hidden rounded-full bg-gray-200"
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "block h-full min-w-2 rounded-full",
                    fitToneClasses.accent,
                  )}
                  style={scoreMeterStyle}
                />
              </div>
              <div className="flex justify-between gap-2 text-[11px] font-bold text-gray-500">
                <span>보완 필요</span>
                <span>검토</span>
                <span>높은 적합</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <FitEvidenceList
              title="강점"
              tone="strength"
              icon={<CheckCircle2 size={15} />}
              items={selectedAnalysis.strengths}
              emptyText="이력서에서 바로 강조할 강점 근거가 부족합니다."
            />
            <FitEvidenceList
              title="기업이 보는 포인트"
              tone="priority"
              icon={<Building2 size={15} />}
              items={selectedAnalysis.companyPriorities}
              emptyText="기업 우선순위가 아직 충분히 추출되지 않았습니다."
            />
            <FitEvidenceList
              title="보완점"
              tone="gap"
              icon={<FileText size={15} />}
              items={selectedAnalysis.gaps}
              emptyText="명확한 감점 요인이 감지되지 않았습니다."
            />
          </div>

          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border border-dashed bg-white p-3 shadow-sm",
              fitToneClasses.border,
            )}
          >
            <div
              className={cn(
                "grid size-8 flex-none place-items-center rounded-lg text-white",
                fitToneClasses.accent,
              )}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <strong
                className={cn("block text-xs font-black", fitToneClasses.text)}
              >
                다음 액션
              </strong>
              <p className="mt-1 text-sm font-semibold leading-6 text-gray-800">
                {selectedAnalysis.recommendation}
              </p>
              <ol className="mt-2 grid gap-1.5 text-sm leading-6 text-gray-700">
                {actionItems.map((item, index) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-1 grid size-5 flex-none place-items-center rounded-full text-[11px] font-black text-white",
                        fitToneClasses.accent,
                      )}
                    >
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.fitEmptyState}>
          결과 확인 버튼을 누르면 이력서 기반 적합도 요약을 확인할 수 있습니다.
        </div>
      )}
    </section>
  );
}

function FitEvidenceList({
  title,
  items,
  icon,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  tone: "strength" | "priority" | "gap";
  emptyText: string;
}) {
  const toneClasses = fitInsightToneClassNames[tone];

  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-gray-200 border-t-4 bg-white p-3 shadow-sm",
        toneClasses.card,
      )}
    >
      <strong
        className={cn(
          "mb-2 flex items-center gap-1.5 text-sm font-black",
          toneClasses.title,
        )}
      >
        {icon}
        {title}
      </strong>
      <ul className="grid gap-1.5">
        {items.length ? (
          items.map((item) => (
            <li
              key={item}
              className="relative pl-3 text-xs leading-5 text-gray-700 before:absolute before:left-0 before:top-[0.7em] before:size-1 before:rounded-full before:bg-current"
            >
              {item}
            </li>
          ))
        ) : (
          <li className="relative pl-3 text-xs leading-5 text-gray-700 before:absolute before:left-0 before:top-[0.7em] before:size-1 before:rounded-full before:bg-current">
            {emptyText}
          </li>
        )}
      </ul>
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

function getFitVerdict(score: number) {
  if (score >= 85) {
    return {
      label: "높은 적합",
      headline: "바로 지원을 검토해도 좋은 공고입니다.",
      description: "지원 우선순위 상위",
    };
  }

  if (score >= 70) {
    return {
      label: "검토 추천",
      headline: "핵심 조건은 맞고, 일부 근거 보강이 필요합니다.",
      description: "핵심 조건 일부 보완",
    };
  }

  if (score >= 40) {
    return {
      label: "조건 점검",
      headline: "지원 전 조건과 이력서 근거를 다시 맞춰야 합니다.",
      description: "요건 매칭 재검토",
    };
  }

  return {
    label: "보완 필요",
    headline: "현재 이력서만으로는 설득 근거가 부족합니다.",
    description: "이력서 근거 강화 우선",
  };
}

function getFitTone(score: number) {
  if (score >= 85) return "High";
  if (score >= 70) return "Mid";
  if (score >= 40) return "Watch";
  return "Low";
}

function clampFitScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function buildDetailedActionItems(
  analysis: JobFitAnalysisItem,
  job: JobDetailItem,
) {
  const family = jobFamilyLabels[job.jobFamily];
  const priorities =
    analysis.companyPriorities.slice(0, 2).join(" / ") ||
    `${family} 직무 경험과 공고 요건`;
  const gaps =
    analysis.gaps.slice(0, 2).join(" / ") || "공고와 직접 연결되는 이력서 근거";

  return [
    `이력서 첫 화면 요약에 ${family} 직무와 직접 연결되는 업무 2개를 먼저 배치하고, 각 항목마다 기간, 역할, 산출물, 사용한 기준이나 툴을 한 줄로 붙이세요.`,
    `공고에서 보는 포인트인 "${priorities}"에 맞춰 관련 경험을 다시 고르고, 단순 업무명 대신 처리 건수, 검토 범위, 개선 결과처럼 숫자나 결과가 보이는 표현으로 바꾸세요.`,
    `현재 보완점인 "${gaps}"를 해소하기 위해 지원 전 체크리스트를 만들고, 누락된 자격증/경력/고객 커뮤니케이션 근거를 이력서 상단 1페이지 안에 보강한 뒤 다시 분석을 돌리세요.`,
  ];
}

function JobDetail({
  job,
  currentUser,
  resumes,
  selectedResumeId,
  onResumeChange,
  onAnalyze,
  analysisLoading,
  analysisError,
  displayedAnalysis,
}: {
  job: JobDetailItem;
  currentUser: AuthUser | null;
  resumes: ResumeItem[];
  selectedResumeId: string;
  onResumeChange: (resumeId: string) => void;
  onAnalyze: () => void;
  analysisLoading: boolean;
  analysisError: string;
  displayedAnalysis: JobFitAnalysisItem | null;
}) {
  const initial = job.companyName.charAt(0);

  const dDayLabel =
    job.dDay === null
      ? deadlineTypeLabels[job.deadlineType]
      : job.dDay < 0
        ? "마감"
        : job.dDay === 0
          ? "오늘 마감"
          : `D-${job.dDay}`;

  const isUrgent = job.dDay !== null && job.dDay >= 0 && job.dDay <= 7;
  const heroStyle: CSSProperties | undefined = job.companyBackgroundUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.76) 42%, rgba(15,23,42,0.18) 100%), url("${job.companyBackgroundUrl}")`,
      }
    : undefined;
  const experienceText = formatExperience(
    job.minExperienceYears,
    job.maxExperienceYears,
  );
  const aiSummaryText =
    job.aiSummary?.trim() || job.aiSuggestion?.summary || null;
  const trackOriginalClick = () => {
    void recordJobEngagement(job.id, "ORIGINAL_CLICK").catch(() => {});
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />
      <Breadcrumb
        items={[{ label: "채용공고", href: "/jobs" }]}
        current={job.title}
      />

      <div className={styles.hero} style={heroStyle}>
        <div className={styles.heroGlow} />
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link
            href="/jobs"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ArrowLeft size={13} />
            채용공고 목록
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-3">
              <div className={styles.logo}>
                {job.companyLogoUrl ? (
                  <img src={job.companyLogoUrl} alt={job.companyName} />
                ) : (
                  initial
                )}
              </div>
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      styles.dDay,
                      isUrgent ? styles.dDayUrgent : styles.dDayMuted,
                    )}
                  >
                    {dDayLabel}
                  </span>
                  <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                    {companyTypeLabels[job.companyType]}
                  </span>
                  <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                    {jobFamilyLabels[job.jobFamily]}
                  </span>
                </div>
                <Link
                  href={companyDetailHref(job.companyId)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[var(--brand)]"
                >
                  <BriefcaseBusiness size={13} />
                  {job.companyName}
                </Link>
                <h1 className="mt-1 max-w-3xl text-xl font-bold leading-snug text-gray-900">
                  {job.title}
                </h1>
              </div>
            </div>

            <a
              href={job.originalUrl}
              target="_blank"
              rel="noreferrer"
              className={actionButtonClassName({ size: "md" })}
              onClick={trackOriginalClick}
            >
              원문에서 지원
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>

      <section className={styles.body}>
        <div className="grid gap-4">
          <JobFitAnalysisPanel
            job={job}
            currentUser={currentUser}
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onResumeChange={onResumeChange}
            onAnalyze={onAnalyze}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            displayedAnalysis={displayedAnalysis}
          />

          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <FileText size={15} className={styles.sectionIcon} />
              공고 정보
            </h2>
            <div className={styles.infoGrid}>
              <InfoItem label="직무군" value={jobFamilyLabels[job.jobFamily]} />
              <InfoItem
                label="고용형태"
                value={employmentLabels[job.employmentType]}
              />
              <InfoItem
                label="KICPA 조건"
                value={kicpaLabels[job.kicpaCondition]}
              />
              <InfoItem
                label="수습 CPA"
                value={traineeLabels[job.traineeStatus]}
              />
              <InfoItem
                label="실무수습기관"
                value={formatTrainingInstitution(
                  job.practicalTrainingInstitution,
                )}
              />
              <InfoItem label="요구 경력" value={experienceText} />
              <InfoItem label="지역" value={job.location ?? "불명확"} />
              <InfoItem label="마감일" value={formatDeadlineDisplay(job)} />
            </div>
          </section>

          <section className={styles.aiSummary}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--brand)]">
              <Sparkles size={15} />
              AI 요약
            </h2>
            {aiSummaryText ? (
              <div className="grid gap-3">
                <p className="text-sm leading-6 text-gray-700">
                  {aiSummaryText}
                </p>
                {job.aiSuggestion && (
                  <>
                    <ChipGroup
                      title="추천 태그"
                      items={job.aiSuggestion.tags}
                      tone="pink"
                    />
                    <ChipGroup
                      title="확인 필요"
                      items={job.aiSuggestion.risks}
                      tone="gray"
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">
                아직 AI 요약이 없습니다. 추후 관리자 검수 후 요약과 태그가
                표시됩니다.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <ScrollText size={15} className={styles.sectionIcon} />
              공고 본문
            </h2>
            <p className="whitespace-pre-line text-sm leading-7 text-neutral-700">
              {job.description}
            </p>
          </section>
        </div>

        <aside className={styles.aside}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <CheckCircle2 size={15} className={styles.sectionIcon} />
            출처 정보
          </h2>
          <div className="grid gap-3">
            <InfoItem label="출처" value={job.sourceName} />
            <InfoItem
              label="최종 확인"
              value={new Date(job.lastCheckedAt).toLocaleDateString("ko-KR")}
            />
            <InfoItem
              label="마감 유형"
              value={deadlineTypeLabels[job.deadlineType]}
            />
          </div>

          <a
            href={job.originalUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.externalLink}
            onClick={trackOriginalClick}
          >
            원문 링크 열기
            <ExternalLink size={14} />
          </a>

          {job.labels.length > 0 && (
            <div className={styles.labelsSection}>
              <p className={styles.labelsTitle}>라벨</p>
              <div className={styles.labelsList}>
                {job.labels.map((label) => (
                  <span key={label} className={styles.labelChip}>
                    #{label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            href={companyDetailHref(job.companyId)}
            className={styles.companyLink}
          >
            <div className={styles.companyMiniIcon}>
              {job.companyName.charAt(0)}
            </div>
            <span className="flex items-center gap-1.5">
              <Building2 size={14} />
              회사 상세 보기
            </span>
          </Link>
        </aside>
      </section>
    </main>
  );
}
