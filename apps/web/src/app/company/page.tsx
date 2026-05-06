"use client";

import type {
  CompanyDashboardResponse,
  CompanyManagedJobItem,
  DeadlineType,
  EmploymentType,
  JobFamily,
  JobSubmissionItem,
  KicpaCondition,
  TraineeStatus,
} from "@cpa/shared";
import {
  DEADLINE_TYPES,
  EMPLOYMENT_TYPES,
  JOB_FAMILIES,
  KICPA_CONDITIONS,
  TRAINEE_STATUSES,
} from "@cpa/shared";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  PencilLine,
  Send,
  Trash2,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import {
  ActionButton,
  ActionLink,
  actionButtonClassName,
} from "@/components/ui/action-button";
import {
  cancelCompanyJobSubmission,
  deleteCompanyJob,
  fetchCompanyDashboard,
  fetchCompanyJobs,
  fetchCompanyJobSubmissions,
  submitCompanyJob,
  submitCompanyJobEdit,
  updateCompanyJobSubmission,
} from "@/lib/api";
import {
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "./company-page.module.css";

type JobForm = {
  title: string;
  description: string;
  originalUrl: string;
  jobFamily: string;
  employmentType: string;
  kicpaCondition: string;
  traineeStatus: string;
  practicalTrainingInstitution: string;
  minExperienceYears: string;
  maxExperienceYears: string;
  location: string;
  deadlineType: string;
  deadline: string;
};

const emptyJobForm: JobForm = {
  title: "",
  description: "",
  originalUrl: "",
  jobFamily: "AUDIT",
  employmentType: "FULL_TIME",
  kicpaCondition: "UNCLEAR",
  traineeStatus: "UNCLEAR",
  practicalTrainingInstitution: "",
  minExperienceYears: "",
  maxExperienceYears: "",
  location: "",
  deadlineType: "FIXED_DATE",
  deadline: "",
};

export default function CompanyPage() {
  const [dashboard, setDashboard] = useState<CompanyDashboardResponse | null>(
    null,
  );
  const [managedJobs, setManagedJobs] = useState<CompanyManagedJobItem[]>([]);
  const [jobSubmissions, setJobSubmissions] = useState<JobSubmissionItem[]>([]);
  const [jobForm, setJobForm] = useState<JobForm>(emptyJobForm);
  const [editingJob, setEditingJob] = useState<CompanyManagedJobItem | null>(
    null,
  );
  const [editingSubmission, setEditingSubmission] =
    useState<JobSubmissionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load(options: { quiet?: boolean } = {}) {
    if (!options.quiet) {
      setLoading(true);
      setMessage("");
    }
    try {
      const [dashboardData, jobsData, submissionData] = await Promise.all([
        fetchCompanyDashboard(),
        fetchCompanyJobs(),
        fetchCompanyJobSubmissions(),
      ]);
      setDashboard(dashboardData);
      setManagedJobs(jobsData.items);
      setJobSubmissions(submissionData.items);
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
    Promise.all([
      fetchCompanyDashboard(),
      fetchCompanyJobs(),
      fetchCompanyJobSubmissions(),
    ])
      .then(([dashboardData, jobsData, submissionData]) => {
        if (ignore) return;
        setDashboard(dashboardData);
        setManagedJobs(jobsData.items);
        setJobSubmissions(submissionData.items);
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
          <div className={styles.loadingText}>
            기업 공고 관리 정보를 불러오는 중입니다.
          </div>
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

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>기업 공고 관리</p>
              <h1 className={styles.title}>{company.name}</h1>
              <p className={styles.description}>
                {companyTypeLabels[company.type]} · 공개 {openJobs.length}건 ·
                삭제 {closedJobs.length}건
              </p>
            </div>
            <ActionLink
              href={`/companies/${company.id}`}
              variant="subtle"
              size="md"
            >
              공개 페이지
            </ActionLink>
          </header>

          {message && (
            <div className={styles.message}>{message}</div>
          )}

          <section className={styles.metricGrid}>
            <Metric label="게시 중" value={`${openJobs.length}건`} />
            <Metric label="삭제 처리" value={`${closedJobs.length}건`} />
            <Metric
              label="검수 대기"
              value={`${pendingSubmissions.length}건`}
            />
          </section>

          <section className={styles.managementGrid}>
            <JobSubmissionForm
              editingJob={editingJob}
              editingSubmission={editingSubmission}
              form={jobForm}
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

function JobSubmissionForm({
  editingJob,
  editingSubmission,
  form,
  onChange,
  onSubmit,
  onCancelEdit,
}: {
  editingJob: CompanyManagedJobItem | null;
  editingSubmission: JobSubmissionItem | null;
  form: JobForm;
  onChange: (form: JobForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}) {
  const mode = editingSubmission ? "submission" : editingJob ? "job" : "new";

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <SectionTitle
        icon={
          mode === "new" ? (
            <ClipboardList size={19} />
          ) : (
            <PencilLine size={19} />
          )
        }
        title={
          mode === "submission"
            ? "공고 요청 수정"
            : mode === "job"
              ? "공고 수정 요청"
              : "채용공고 게시 요청"
        }
        aside={
          mode === "submission"
            ? "검수 전 내용 수정"
            : mode === "job"
              ? "Admin 검수 후 반영"
              : "Admin 검수 후 공개"
        }
      />
      {(editingJob || editingSubmission) && (
        <div className={styles.editNotice}>
          <span className={styles.editTarget}>
            수정 대상: {editingSubmission?.title ?? editingJob?.title}
          </span>
          <button
            className={styles.textButton}
            type="button"
            onClick={onCancelEdit}
          >
            취소
          </button>
        </div>
      )}
      <div className={styles.formGrid}>
        <Field label="공고명">
          <input
            className="form-input"
            required
            value={form.title}
            onChange={(event) =>
              onChange({ ...form, title: event.target.value })
            }
          />
        </Field>
        <Field label="원문 링크">
          <input
            className="form-input"
            required
            value={form.originalUrl}
            onChange={(event) =>
              onChange({ ...form, originalUrl: event.target.value })
            }
          />
        </Field>
        <SelectField
          label="직무군"
          value={form.jobFamily}
          options={JOB_FAMILIES}
          labels={jobFamilyLabels}
          onChange={(value) => onChange({ ...form, jobFamily: value })}
        />
        <SelectField
          label="고용 형태"
          value={form.employmentType}
          options={EMPLOYMENT_TYPES}
          labels={employmentLabels}
          onChange={(value) => onChange({ ...form, employmentType: value })}
        />
        <SelectField
          label="KICPA 조건"
          value={form.kicpaCondition}
          options={KICPA_CONDITIONS}
          labels={kicpaLabels}
          onChange={(value) => onChange({ ...form, kicpaCondition: value })}
        />
        <SelectField
          label="수습 CPA"
          value={form.traineeStatus}
          options={TRAINEE_STATUSES}
          labels={traineeLabels}
          onChange={(value) => onChange({ ...form, traineeStatus: value })}
        />
        <Field label="실무수습기관">
          <select
            className="form-input"
            value={form.practicalTrainingInstitution}
            onChange={(event) =>
              onChange({
                ...form,
                practicalTrainingInstitution: event.target.value,
              })
            }
          >
            <option value="">불명확</option>
            <option value="true">가능</option>
            <option value="false">불가</option>
          </select>
        </Field>
        <SelectField
          label="마감 유형"
          value={form.deadlineType}
          options={DEADLINE_TYPES}
          labels={deadlineTypeLabels}
          onChange={(value) => onChange({ ...form, deadlineType: value })}
        />
        <Field label="마감일">
          <input
            className="form-input"
            disabled={form.deadlineType !== "FIXED_DATE"}
            required={form.deadlineType === "FIXED_DATE"}
            type="date"
            value={form.deadline}
            onChange={(event) =>
              onChange({ ...form, deadline: event.target.value })
            }
          />
        </Field>
        <Field label="최소 경력">
          <input
            className="form-input"
            min={0}
            type="number"
            value={form.minExperienceYears}
            onChange={(event) =>
              onChange({ ...form, minExperienceYears: event.target.value })
            }
          />
        </Field>
        <Field label="최대 경력">
          <input
            className="form-input"
            min={0}
            type="number"
            value={form.maxExperienceYears}
            onChange={(event) =>
              onChange({ ...form, maxExperienceYears: event.target.value })
            }
          />
        </Field>
        <Field label="지역">
          <input
            className="form-input"
            value={form.location}
            onChange={(event) =>
              onChange({ ...form, location: event.target.value })
            }
          />
        </Field>
      </div>
      <Field label="공고 내용">
        <textarea
          className={cn("form-input", styles.descriptionInput)}
          required
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
        />
      </Field>
      <ActionButton
        type="submit"
        className={styles.fitAction}
        iconStart={<Send size={16} />}
      >
        {mode === "submission"
          ? "요청 수정"
          : mode === "job"
            ? "수정 요청"
            : "게시 요청"}
      </ActionButton>
    </form>
  );
}

function RequestedJobCard({
  submission,
  onEdit,
  onCancel,
}: {
  submission: JobSubmissionItem;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <article className={styles.requestCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMain}>
          <div className={styles.badgeRow}>
            <Badge tone="brand">게시 요청 검수 대기</Badge>
          </div>
          <h3 className={styles.cardTitle}>{submission.title}</h3>
          <p className={styles.cardMeta}>
            {jobFamilyLabels[submission.jobFamily]} ·{" "}
            {employmentLabels[submission.employmentType]} ·{" "}
            {submission.location ?? "지역 불명확"}
          </p>
        </div>
        <div className={styles.actionGroup}>
          <ActionButton
            variant="outline"
            size="sm"
            type="button"
            iconStart={<PencilLine size={15} />}
            onClick={onEdit}
          >
            요청 수정
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            type="button"
            iconStart={<Trash2 size={15} />}
            onClick={onCancel}
          >
            요청 취소
          </ActionButton>
        </div>
      </div>
      <div className={styles.infoGrid}>
        <Info label="KICPA" value={kicpaLabels[submission.kicpaCondition]} />
        <Info label="수습" value={traineeLabels[submission.traineeStatus]} />
        <Info
          label="실무수습"
          value={
            submission.practicalTrainingInstitution === null
              ? "불명확"
              : submission.practicalTrainingInstitution
                ? "가능"
                : "불가"
          }
        />
        <Info label="경력" value={experienceLabel(submission)} />
        <Info label="마감" value={deadlineLabel(submission)} />
        <Info
          label="제출일"
          value={new Date(submission.createdAt).toLocaleDateString("ko-KR")}
        />
      </div>
    </article>
  );
}

function ManagedJobCard({
  job,
  onEdit,
  onClose,
  onEditPending,
  onCancelPending,
}: {
  job: CompanyManagedJobItem;
  onEdit: () => void;
  onClose: () => void;
  onEditPending: (submission: JobSubmissionItem) => void;
  onCancelPending: (submission: JobSubmissionItem) => void;
}) {
  const isOpen = job.status === "OPEN";
  const pendingEdit = job.pendingEditSubmission;
  return (
    <article className={styles.jobCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMain}>
          <div className={styles.badgeRow}>
            <Badge tone={isOpen ? "brand" : "muted"}>
              {isOpen ? "게시 중" : "삭제 처리"}
            </Badge>
            {pendingEdit && <Badge tone="brand">수정 검수 대기</Badge>}
          </div>
          <h3 className={styles.cardTitle}>{job.title}</h3>
          <p className={styles.cardMeta}>
            {jobFamilyLabels[job.jobFamily]} ·{" "}
            {employmentLabels[job.employmentType]} ·{" "}
            {job.location ?? "지역 불명확"}
          </p>
        </div>
        <div className={styles.actionGroup}>
          {isOpen ? (
            <ActionLink
              variant="subtle"
              size="sm"
              href={`/jobs/${job.id}`}
            >
              보기
            </ActionLink>
          ) : (
            <span
              className={cn(
                actionButtonClassName({ variant: "subtle", size: "sm" }),
                styles.disabledAction,
              )}
            >
              비공개
            </span>
          )}
          <ActionButton
            variant="subtle"
            size="sm"
            disabled={!isOpen || Boolean(pendingEdit)}
            type="button"
            iconStart={<PencilLine size={15} />}
            onClick={onEdit}
          >
            수정 요청
          </ActionButton>
          {pendingEdit && (
            <>
              <ActionButton
                variant="outline"
                size="sm"
                type="button"
                iconStart={<PencilLine size={15} />}
                onClick={() => onEditPending(pendingEdit)}
              >
                요청 수정
              </ActionButton>
              <ActionButton
                variant="subtle"
                size="sm"
                type="button"
                onClick={() => onCancelPending(pendingEdit)}
              >
                요청 취소
              </ActionButton>
            </>
          )}
          <ActionButton
            variant="primary"
            size="sm"
            disabled={!isOpen}
            type="button"
            iconStart={<Trash2 size={15} />}
            onClick={onClose}
          >
            삭제
          </ActionButton>
        </div>
      </div>
      <div className={styles.infoGrid}>
        <Info label="KICPA" value={kicpaLabels[job.kicpaCondition]} />
        <Info label="수습" value={traineeLabels[job.traineeStatus]} />
        <Info
          label="실무수습"
          value={
            job.practicalTrainingInstitution === null
              ? "불명확"
              : job.practicalTrainingInstitution
                ? "가능"
                : "불가"
          }
        />
        <Info label="경력" value={experienceLabel(job)} />
        <Info label="마감" value={deadlineLabel(job)} />
        <Info
          label="최종 확인"
          value={new Date(job.lastCheckedAt).toLocaleDateString("ko-KR")}
        />
      </div>
    </article>
  );
}

function SubmissionPanel({
  submissions,
}: {
  submissions: JobSubmissionItem[];
}) {
  return (
    <aside className={styles.historyPanel}>
      <SectionTitle
        icon={<CheckCircle2 size={19} />}
        title="요청 이력"
        aside={`${submissions.length.toLocaleString("ko-KR")}건`}
      />
      <div className={styles.historyList}>
        {submissions.length ? (
          submissions
            .slice(0, 10)
            .map((submission) => (
              <StatusRow
                key={submission.id}
                title={submission.title}
                status={submission.status}
                type={submission.submissionType}
                meta={
                  submission.targetJobTitle
                    ? `대상: ${submission.targetJobTitle}`
                    : new Date(submission.createdAt).toLocaleDateString("ko-KR")
                }
              />
            ))
        ) : (
          <p className={styles.mutedText}>요청 이력이 없습니다.</p>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  aside,
}: {
  icon: ReactNode;
  title: string;
  aside: string;
}) {
  return (
    <div className={styles.sectionTitle}>
      <h2 className={styles.sectionHeading}>
        {icon}
        {title}
      </h2>
      <span className={styles.sectionCount}>{aside}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </Field>
  );
}

function StatusRow({
  title,
  status,
  type,
  meta,
}: {
  title: string;
  status: string;
  type: string;
  meta: string;
}) {
  return (
    <div className={styles.statusRow}>
      <div className={styles.statusRowHeader}>
        <p className={styles.statusTitle}>{title}</p>
        <span className={styles.statusValue}>{statusLabel(status)}</span>
      </div>
      <p className={styles.statusMeta}>
        {type === "UPDATE" ? "수정 요청" : "신규 게시"} · {meta}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.info}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "brand" | "muted";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        styles.badge,
        tone === "brand" ? styles.badgeBrand : styles.badgeMuted,
      )}
    >
      {children}
    </span>
  );
}

function statusLabel(status: string) {
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "반려";
  return "검수 대기";
}

function toJobPayload(form: JobForm) {
  return {
    title: form.title,
    description: form.description,
    originalUrl: form.originalUrl,
    jobFamily: form.jobFamily as JobFamily,
    employmentType: form.employmentType as EmploymentType,
    kicpaCondition: form.kicpaCondition as KicpaCondition,
    traineeStatus: form.traineeStatus as TraineeStatus,
    practicalTrainingInstitution:
      form.practicalTrainingInstitution === ""
        ? undefined
        : form.practicalTrainingInstitution === "true",
    minExperienceYears: optionalNumber(form.minExperienceYears),
    maxExperienceYears: optionalNumber(form.maxExperienceYears),
    location: form.location,
    deadlineType: form.deadlineType as DeadlineType,
    deadline:
      form.deadlineType === "FIXED_DATE" && form.deadline
        ? kstEndOfDayIso(form.deadline)
        : undefined,
  };
}

function toJobForm(job: CompanyManagedJobItem): JobForm {
  return {
    title: job.title,
    description: job.description,
    originalUrl: job.originalUrl,
    jobFamily: job.jobFamily,
    employmentType: job.employmentType,
    kicpaCondition: job.kicpaCondition,
    traineeStatus: job.traineeStatus,
    practicalTrainingInstitution:
      job.practicalTrainingInstitution === null
        ? ""
        : String(job.practicalTrainingInstitution),
    minExperienceYears: job.minExperienceYears?.toString() ?? "",
    maxExperienceYears: job.maxExperienceYears?.toString() ?? "",
    location: job.location ?? "",
    deadlineType: job.deadlineType,
    deadline: job.deadline ? job.deadline.slice(0, 10) : "",
  };
}

function toSubmissionForm(submission: JobSubmissionItem): JobForm {
  return {
    title: submission.title,
    description: submission.description,
    originalUrl: submission.originalUrl ?? "",
    jobFamily: submission.jobFamily,
    employmentType: submission.employmentType,
    kicpaCondition: submission.kicpaCondition,
    traineeStatus: submission.traineeStatus,
    practicalTrainingInstitution:
      submission.practicalTrainingInstitution === null
        ? ""
        : String(submission.practicalTrainingInstitution),
    minExperienceYears: submission.minExperienceYears?.toString() ?? "",
    maxExperienceYears: submission.maxExperienceYears?.toString() ?? "",
    location: submission.location ?? "",
    deadlineType: submission.deadlineType,
    deadline: submission.deadline ? submission.deadline.slice(0, 10) : "",
  };
}

function optionalNumber(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function kstEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.000+09:00`).toISOString();
}

type ExperienceFields = {
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
};

type DeadlineFields = {
  deadlineType: DeadlineType;
  deadline: string | null;
};

function experienceLabel(job: ExperienceFields) {
  if (job.minExperienceYears === null && job.maxExperienceYears === null) {
    return "무관";
  }
  if (job.minExperienceYears !== null && job.maxExperienceYears !== null) {
    return `${job.minExperienceYears}~${job.maxExperienceYears}년`;
  }
  if (job.minExperienceYears !== null)
    return `${job.minExperienceYears}년 이상`;
  return `${job.maxExperienceYears}년 이하`;
}

function deadlineLabel(job: DeadlineFields) {
  if (!job.deadline) return deadlineTypeLabels[job.deadlineType];
  return new Date(job.deadline).toLocaleDateString("ko-KR");
}
