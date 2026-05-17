"use client";

import type {
  CompanyAnalyticsDashboardResponse,
  CompanyDashboardResponse,
  CompanyManagedJobItem,
  JobSubmissionItem,
} from "@cpa/shared";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Lightbulb,
  ListChecks,
  MousePointerClick,
  Sparkles,
  Star,
  Target,
  Trash2 as TrashIcon,
} from "lucide-react";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { JobSubmissionForm } from "./_components/job-submission-form";
import { ManagedJobCard } from "./_components/managed-job-card";
import { Metric } from "./_components/metric";
import { ProfileImageSettings } from "./_components/profile-image-settings";
import { RequestedJobCard } from "./_components/requested-job-card";
import { SectionTitle } from "./_components/section-title";
import { SubmissionPanel } from "./_components/submission-panel";
import { fetchCompanyPageData } from "./_lib/company-page-data";
import {
  applyJobAutofillDraft,
  emptyJobForm,
  type JobForm,
  toJobForm,
  toJobPayload,
  toSubmissionForm,
} from "./_lib/job-form";
import {
  emptyProfileImageForm,
  type ProfileImageForm,
  toBackgroundProfileImageForm,
  toLogoProfileImageForm,
} from "./_lib/profile-image-form";
import { SiteNav } from "@/components/site-nav";
import { ActionLink } from "@/components/ui/action-button";
import {
  cancelCompanyJobSubmission,
  deleteCompanyJob,
  generateCompanyJobDraft,
  submitCompanyJob,
  submitCompanyJobEdit,
  updateCompanyBackground,
  updateCompanyJobSubmission,
  updateCompanyLogo,
  uploadCompanyBackground,
  uploadCompanyLogo,
} from "@/lib/api";
import { companyTypeLabels } from "@/lib/labels";
import { companyDetailHref } from "@/lib/routes";
import styles from "./company-page.module.css";

const analyticsLineLabels = {
  detailViews: "상세 조회",
  originalClicks: "원문 클릭",
  bookmarkAdds: "북마크 추가",
} as const;

const aiInterpretations = [
  {
    label: "관심 구조",
    title: "조회는 확보됐지만 원문 클릭 전환은 공고별 편차가 큽니다.",
    description:
      "직무 범위와 수습 가능 여부가 첫 화면에 보이는 공고는 원문 이동 의도가 높다는 가정입니다.",
  },
  {
    label: "후보군 반응",
    title: "주니어·수습 후보군은 조건 명확성에 더 크게 반응합니다.",
    description:
      "연차, KICPA 조건, 실무수습 인정 여부가 함께 정리된 공고를 비교 목록에 저장하는 패턴으로 구성했습니다.",
  },
  {
    label: "마감 압력",
    title: "마감 임박 공고는 북마크 대비 클릭 전환이 둔화됩니다.",
    description:
      "D-7 이후에는 상세 조회가 늘어도 원문 클릭이 분산될 수 있어 리마인드 소재가 필요합니다.",
  },
] as const;

const aiDataUseResults = [
  {
    label: "타깃 세그먼트",
    title: "실무수습 가능 + 세무/감사 관심군",
    description:
      "북마크와 원문 클릭이 겹치는 후보를 우선 노출 타깃으로 묶어 운영하는 방향입니다.",
  },
  {
    label: "공고 활용",
    title: "상위 관심 공고 2건을 대표 채용 카드로 재사용",
    description:
      "조회·북마크·클릭률을 합산한 내부 점수로 대표 공고 후보를 고르는 방식입니다.",
  },
  {
    label: "콘텐츠 보강",
    title: "전환 낮은 공고는 첫 문단과 조건 표기를 보강",
    description:
      "상세 조회 후 이탈이 큰 공고에 업무 범위, 성장 경로, 지원 조건을 분리 노출하는 방식입니다.",
  },
] as const;

const aiRecommendedActions = [
  {
    label: "오늘",
    title: "원문 첫 3줄에 직무 범위와 수습 가능 여부를 먼저 배치",
    description:
      "상세 조회 직후 비교 판단에 필요한 조건을 줄여 원문 클릭 손실을 낮추는 액션입니다.",
  },
  {
    label: "이번 주",
    title: "북마크가 많은 공고를 채용 페이지 상단에 고정",
    description:
      "관심 저장 신호가 있는 공고를 대표 공고로 올려 반복 방문자의 재탐색을 줄입니다.",
  },
  {
    label: "마감 전",
    title: "D-5 시점에 마감 리마인드 문구와 지원 조건 요약을 노출",
    description:
      "마감 임박 조회 증가를 원문 클릭으로 연결하기 위한 운영 가이드입니다.",
  },
] as const;

export default function CompanyPage() {
  const [dashboard, setDashboard] = useState<CompanyDashboardResponse | null>(
    null,
  );
  const [analytics, setAnalytics] =
    useState<CompanyAnalyticsDashboardResponse | null>(null);
  const [managedJobs, setManagedJobs] = useState<CompanyManagedJobItem[]>([]);
  const [jobSubmissions, setJobSubmissions] = useState<JobSubmissionItem[]>([]);
  const [jobForm, setJobForm] = useState<JobForm>(emptyJobForm);
  const [logoImageForm, setLogoImageForm] = useState<ProfileImageForm>(
    emptyProfileImageForm,
  );
  const [backgroundImageForm, setBackgroundImageForm] =
    useState<ProfileImageForm>(emptyProfileImageForm);
  const [logoImageFileName, setLogoImageFileName] = useState("");
  const [backgroundImageFileName, setBackgroundImageFileName] = useState("");
  const [logoImageUploading, setLogoImageUploading] = useState(false);
  const [backgroundImageUploading, setBackgroundImageUploading] =
    useState(false);
  const [editingJob, setEditingJob] = useState<CompanyManagedJobItem | null>(
    null,
  );
  const [editingSubmission, setEditingSubmission] =
    useState<JobSubmissionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [jobAutofillLoading, setJobAutofillLoading] = useState(false);
  const [jobAutofillError, setJobAutofillError] = useState("");

  function applyPageData(
    data: Awaited<ReturnType<typeof fetchCompanyPageData>>,
  ) {
    setDashboard(data.dashboard);
    setAnalytics(data.analytics);
    setLogoImageForm(toLogoProfileImageForm(data.dashboard));
    setBackgroundImageForm(toBackgroundProfileImageForm(data.dashboard));
    setManagedJobs(data.managedJobs);
    setJobSubmissions(data.jobSubmissions);
  }

  async function load(options: { quiet?: boolean } = {}) {
    if (!options.quiet) {
      setLoading(true);
      setMessage("");
    }
    try {
      const data = await fetchCompanyPageData();
      applyPageData(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "불러오지 못했습니다.",
      );
    } finally {
      if (!options.quiet) setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    fetchCompanyPageData()
      .then((data) => {
        if (ignore) return;
        applyPageData(data);
      })
      .catch((error) => {
        if (!ignore) {
          setMessage(
            error instanceof Error ? error.message : "불러오지 못했습니다.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function autoFillJob(sourceText: string) {
    const trimmedSource = sourceText.trim();
    if (trimmedSource.length < 40) {
      setJobAutofillError("원문 공고를 40자 이상 입력해 주세요.");
      return;
    }

    setJobAutofillLoading(true);
    setJobAutofillError("");
    setMessage("");
    try {
      const originalUrl = jobForm.originalUrl.trim();
      const response = await generateCompanyJobDraft({
        sourceText: trimmedSource,
        ...(originalUrl ? { originalUrl } : {}),
      });
      setJobForm((current) => applyJobAutofillDraft(current, response.draft));
      setMessage(
        response.warnings.length
          ? `AI 초안을 적용했습니다. ${response.warnings.join(" ")}`
          : "AI 초안을 적용했습니다. 제출 전 내용을 확인해 주세요.",
      );
    } catch (error) {
      setJobAutofillError(
        error instanceof Error ? error.message : "AI 자동입력에 실패했습니다.",
      );
    } finally {
      setJobAutofillLoading(false);
    }
  }

  async function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = toJobPayload(jobForm);
    try {
      if (editingSubmission) {
        await updateCompanyJobSubmission(editingSubmission.id, payload);
        setMessage("공고 요청이 수정되었습니다.");
      } else if (editingJob) {
        await submitCompanyJobEdit(editingJob.id, payload);
        setMessage("공고 수정 요청이 접수되었습니다.");
      } else {
        await submitCompanyJob(payload);
        setMessage("채용공고 게시 요청이 접수되었습니다.");
      }
      setEditingJob(null);
      setEditingSubmission(null);
      setJobForm(emptyJobForm);
      await load({ quiet: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청에 실패했습니다.",
      );
    }
  }

  async function submitLogoImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dashboard) return;

    setMessage("");
    const logoAssetId = logoImageForm.assetId.trim();
    if (!logoAssetId) {
      setMessage("기업 로고 이미지 파일을 업로드해 주세요.");
      return;
    }

    try {
      await updateCompanyLogo(logoAssetId);
      setLogoImageFileName("");
      setMessage("기업 로고가 바로 변경되었습니다.");
      await load({ quiet: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청에 실패했습니다.",
      );
    }
  }

  async function submitBackgroundImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dashboard) return;

    setMessage("");
    const backgroundAssetId = backgroundImageForm.assetId.trim();
    if (!backgroundAssetId) {
      setMessage("기업 배경 이미지 파일을 업로드해 주세요.");
      return;
    }

    try {
      await updateCompanyBackground(backgroundAssetId);
      setBackgroundImageFileName("");
      setMessage("기업 배경 이미지가 바로 변경되었습니다.");
      await load({ quiet: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청에 실패했습니다.",
      );
    }
  }

  async function uploadLogoImage(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setLogoImageUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadCompanyLogo(file);
      setLogoImageForm({
        assetId: uploaded.assetId,
        imageUrl: uploaded.publicUrl,
      });
      setLogoImageFileName(file.name);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setLogoImageUploading(false);
    }
  }

  async function uploadBackgroundImage(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setBackgroundImageUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadCompanyBackground(file);
      setBackgroundImageForm({
        assetId: uploaded.assetId,
        imageUrl: uploaded.publicUrl,
      });
      setBackgroundImageFileName(file.name);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "배경 이미지 업로드에 실패했습니다.",
      );
    } finally {
      setBackgroundImageUploading(false);
    }
  }

  async function closeJob(job: CompanyManagedJobItem) {
    if (!window.confirm(`'${job.title}' 공고를 삭제 처리할까요?`)) return;
    setMessage("");
    try {
      await deleteCompanyJob(job.id);
      setMessage("공고가 삭제 처리되었습니다.");
      await load({ quiet: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  }

  async function cancelSubmission(submission: JobSubmissionItem) {
    if (!window.confirm(`'${submission.title}' 요청을 취소할까요?`)) return;
    setMessage("");
    try {
      await cancelCompanyJobSubmission(submission.id);
      setMessage("공고 요청이 취소되었습니다.");
      if (editingSubmission?.id === submission.id) {
        setEditingSubmission(null);
        setJobForm(emptyJobForm);
      }
      await load({ quiet: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청 취소에 실패했습니다.",
      );
    }
  }

  function startEdit(job: CompanyManagedJobItem) {
    setEditingJob(job);
    setEditingSubmission(null);
    setJobForm(toJobForm(job));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditSubmission(submission: JobSubmissionItem) {
    setEditingSubmission(submission);
    setEditingJob(null);
    setJobForm(toSubmissionForm(submission));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingJob(null);
    setEditingSubmission(null);
    setJobForm(emptyJobForm);
  }

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <p className={styles.loadingText}>
            기업 공고 관리 정보를 불러오는 중입니다.
          </p>
        </main>
      </>
    );
  }

  if (!dashboard) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>기업 관리</h1>
            <p className={styles.authError}>{message}</p>
            <ActionLink href="/login" className={styles.authAction}>
              로그인
            </ActionLink>
          </div>
        </main>
      </>
    );
  }

  const { company } = dashboard;
  const openJobs = managedJobs.filter((job) => job.status === "OPEN");
  const closedJobs = managedJobs.filter((job) => job.status === "CLOSED");
  const pendingSubmissions = jobSubmissions.filter(
    (submission) => submission.status === "PENDING",
  );
  const pendingCreateSubmissions = pendingSubmissions.filter(
    (submission) => submission.submissionType === "CREATE",
  );
  const managedItemCount = managedJobs.length + pendingCreateSubmissions.length;
  const heroStyle: CSSProperties | undefined = company.backgroundUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(251,251,255,0.94), rgba(238,242,255,0.76)), url("${company.backgroundUrl}")`,
      }
    : undefined;

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.heroWrap}>
          <div className={styles.hero} style={heroStyle}>
            <div className={styles.heroGlow} />
            <div className={styles.heroInner}>
              <div className={styles.heroContent}>
                <div className={styles.companyLogo}>
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logoUrl} alt={`${company.name} 로고`} />
                  ) : (
                    <span>{company.name.slice(0, 2)}</span>
                  )}
                </div>
                <div>
                  <p className={styles.eyebrow}>기업 공고 관리</p>
                  <h1 className={styles.title}>{company.name}</h1>
                  <p className={styles.description}>
                    {companyTypeLabels[company.type]} · 공개 {openJobs.length}건
                    · 삭제 {closedJobs.length}건
                  </p>
                </div>
              </div>
              <ActionLink
                href={companyDetailHref(company.id)}
                variant="subtle"
                size="md"
              >
                공개 페이지
              </ActionLink>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {message ? <div className={styles.message}>{message}</div> : null}

          <section className={styles.metricGrid}>
            <Metric
              label="게시 중"
              value={`${openJobs.length}건`}
              icon={<BriefcaseBusiness size={18} />}
            />
            <Metric
              label="삭제 처리"
              value={`${closedJobs.length}건`}
              icon={<TrashIcon size={18} />}
            />
            <Metric
              label="검수 대기"
              value={`${pendingSubmissions.length}건`}
              icon={<Clock size={18} />}
            />
          </section>

          <AnalyticsSection analytics={analytics} />

          <ProfileImageSettings
            imageKind="logo"
            companyName={company.name}
            currentImageUrl={company.logoUrl}
            form={logoImageForm}
            fileName={logoImageFileName}
            uploading={logoImageUploading}
            onFileChange={uploadLogoImage}
            onSubmit={submitLogoImage}
          />

          <ProfileImageSettings
            imageKind="background"
            companyName={company.name}
            currentImageUrl={company.backgroundUrl}
            form={backgroundImageForm}
            fileName={backgroundImageFileName}
            uploading={backgroundImageUploading}
            onFileChange={uploadBackgroundImage}
            onSubmit={submitBackgroundImage}
          />

          <section className={styles.managementGrid}>
            <JobSubmissionForm
              editingJob={editingJob}
              editingSubmission={editingSubmission}
              form={jobForm}
              autoFillError={jobAutofillError}
              autoFillLoading={jobAutofillLoading}
              onAutoFill={autoFillJob}
              onCancelEdit={cancelEdit}
              onChange={setJobForm}
              onSubmit={submitJob}
            />
            <SubmissionPanel submissions={jobSubmissions} />
          </section>

          <section className={styles.sectionStack}>
            <SectionTitle
              icon={<BriefcaseBusiness size={19} />}
              title="내가 게시한 공고"
              aside={`${managedItemCount}건`}
            />
            {managedItemCount ? (
              <div className={styles.itemList}>
                {pendingCreateSubmissions.map((submission) => (
                  <RequestedJobCard
                    key={submission.id}
                    submission={submission}
                    onCancel={() => void cancelSubmission(submission)}
                    onEdit={() => startEditSubmission(submission)}
                  />
                ))}
                {managedJobs.map((job) => (
                  <ManagedJobCard
                    key={job.id}
                    job={job}
                    onClose={() => void closeJob(job)}
                    onEdit={() => startEdit(job)}
                    onCancelPending={(submission) =>
                      void cancelSubmission(submission)
                    }
                    onEditPending={startEditSubmission}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyPanel}>
                아직 게시된 공고가 없습니다. 위 폼에서 신규 공고를 요청하세요.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function AnalyticsSection({
  analytics,
}: {
  analytics: CompanyAnalyticsDashboardResponse | null;
}) {
  if (!analytics) return null;

  const summary = analytics.summary;
  const hasData =
    summary.detailViews +
      summary.originalClicks +
      summary.bookmarkAdds +
      summary.bookmarkRemoves +
      summary.currentBookmarks >
    0;
  const dailyChartData = analytics.daily.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));
  const maxDailyValue = Math.max(
    1,
    ...analytics.daily.flatMap((point) => [
      point.detailViews,
      point.originalClicks,
      point.bookmarkAdds,
    ]),
  );

  return (
    <section className={styles.analyticsPanel}>
      <SectionTitle
        icon={<BarChart3 size={19} />}
        title="지원자 관심도 분석"
        aside={`${formatShortDate(analytics.period.from)}-${formatShortDate(
          analytics.period.to,
        )}`}
      />

      {!hasData ? (
        <div className={styles.emptyPanel}>아직 분석 데이터가 없습니다.</div>
      ) : (
        <>
          <div className={styles.analyticsMetricGrid}>
            <Metric
              label="상세 조회"
              value={`${formatNumber(summary.detailViews)}회`}
              icon={<Eye size={18} />}
            />
            <Metric
              label="원문 클릭"
              value={`${formatNumber(summary.originalClicks)}회`}
              icon={<MousePointerClick size={18} />}
            />
            <Metric
              label="현재 북마크"
              value={`${formatNumber(summary.currentBookmarks)}개`}
              icon={<Star size={18} />}
            />
            <Metric
              label="클릭률"
              value={`${formatPercent(summary.originalClickRate)}`}
              icon={<BarChart3 size={18} />}
            />
          </div>

          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <div className={styles.analyticsCardHeader}>
                <h3>일자별 추이</h3>
                <span>최근 {analytics.period.days}일</span>
              </div>
              <div className={styles.analyticsLineChart}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={dailyChartData}
                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="var(--app-line)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      interval="preserveStartEnd"
                      minTickGap={18}
                      tick={{ fontSize: 11, fill: "var(--app-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxDailyValue * 1.15)]}
                      tick={{ fontSize: 11, fill: "var(--app-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid var(--app-line)",
                        borderRadius: "0.5rem",
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                        fontSize: "0.8125rem",
                      }}
                      formatter={(value, name) => [
                        `${formatNumber(Number(value))}회`,
                        analyticsLineLabels[
                          String(name) as keyof typeof analyticsLineLabels
                        ] ?? String(name),
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) =>
                        analyticsLineLabels[
                          value as keyof typeof analyticsLineLabels
                        ] ?? value
                      }
                      wrapperStyle={{
                        fontSize: "0.75rem",
                        paddingTop: "0.75rem",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="detailViews"
                      stroke="var(--proto-brand)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="originalClicks"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookmarkAdds"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <div className={styles.analyticsCardHeader}>
                <h3>공고별 성과</h3>
                <span>{analytics.jobs.length}건</span>
              </div>
              <div className={styles.analyticsTable}>
                <div className={styles.analyticsTableHead}>
                  <span>공고</span>
                  <span>조회</span>
                  <span>원문</span>
                  <span>북마크</span>
                  <span>클릭률</span>
                </div>
                {analytics.jobs.map((job) => (
                  <div key={job.jobId} className={styles.analyticsTableRow}>
                    <div className={styles.analyticsJobCell}>
                      <strong>{job.title}</strong>
                      <span>{job.status === "OPEN" ? "게시 중" : "삭제 처리"}</span>
                    </div>
                    <span>{formatNumber(job.detailViews)}</span>
                    <span>{formatNumber(job.originalClicks)}</span>
                    <span>{formatNumber(job.currentBookmarks)}</span>
                    <span>{formatPercent(job.originalClickRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AiInsightSection periodDays={analytics.period.days} />
        </>
      )}
    </section>
  );
}

function AiInsightSection({ periodDays }: { periodDays: number }) {
  return (
    <div className={styles.aiInsightPanel}>
      <div className={styles.aiInsightHeader}>
        <div>
          <div className={styles.aiInsightKicker}>
            <Sparkles size={16} />
            AI 분석 리포트
          </div>
          <p>
            최근 {periodDays}일 관심도 흐름을 채용 운영 관점에서 쉽게 정리했습니다.
            어떤 공고를 먼저 손봐야 하는지와 바로 할 일을 함께 제안합니다.
          </p>
        </div>
        <span className={styles.aiInsightBadge}>이번 주 우선순위</span>
      </div>

      <div className={styles.aiInsightGrid}>
        <AiInsightColumn
          icon={<Lightbulb size={16} />}
          title="해석"
          items={aiInterpretations}
        />
        <AiInsightColumn
          icon={<Target size={16} />}
          title="데이터 활용 결과"
          items={aiDataUseResults}
        />
        <AiInsightColumn
          icon={<ListChecks size={16} />}
          title="권장 행위"
          items={aiRecommendedActions}
        />
      </div>
    </div>
  );
}

function AiInsightColumn({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: readonly {
    label: string;
    title: string;
    description: string;
  }[];
}) {
  return (
    <section className={styles.aiInsightColumn}>
      <div className={styles.aiInsightColumnHeader}>
        <span className={styles.aiInsightColumnIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <ul className={styles.aiInsightList}>
        {items.map((item) => (
          <AiInsightItem key={`${title}-${item.label}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function AiInsightItem({
  item,
}: {
  item: {
    label: string;
    title: string;
    description: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className={styles.aiInsightItem}>
      <span className={styles.aiInsightItemLabel}>
        <CheckCircle2 size={13} />
        {item.label}
      </span>
      <div className={styles.aiInsightTitleRow}>
        <strong>{item.title}</strong>
        <button
          type="button"
          className={`${styles.aiInsightToggle} ${
            expanded ? styles.aiInsightToggleOpen : ""
          }`}
          aria-label={expanded ? "설명 접기" : "설명 보기"}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {expanded ? <p>{item.description}</p> : null}
    </li>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatPercent(value: number) {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  })}%`;
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}
