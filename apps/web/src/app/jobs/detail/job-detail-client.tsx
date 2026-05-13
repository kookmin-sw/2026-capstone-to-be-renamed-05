"use client";

import type { JobDetailItem } from "@cpa/shared";
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
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ChipGroup } from "./_components/chip-group";
import {
  formatDeadlineDisplay,
  formatExperience,
  formatTrainingInstitution,
} from "./_lib/job-detail-utils";
import { SiteNav } from "@/components/site-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InfoItem } from "@/components/ui/info-item";
import { actionButtonClassName } from "@/components/ui/action-button";
import { fetchJobDetail, recordJobEngagement } from "@/lib/api";
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

export function JobDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [job, setJob] = useState<JobDetailItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const recordedDetailJobId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let ignore = false;
    fetchJobDetail(id)
      .then((data) => {
        if (!ignore) {
          setJob(data);
          setError("");
          if (recordedDetailJobId.current !== data.id) {
            recordedDetailJobId.current = data.id;
            void recordJobEngagement(data.id, "DETAIL_VIEW").catch(() => {});
          }
        }
      })
      .catch((caught: Error) => {
        if (!ignore) setError(caught.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

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
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-red-700">
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">공고를 찾을 수 없습니다.</h1>
            <p className="mt-1 text-sm text-red-700">공고 ID가 누락되었습니다.</p>
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
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-red-700">
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">공고를 찾을 수 없습니다.</h1>
            <p className="mt-1 text-sm text-red-700">
              {error || "요청한 공고가 없거나 더 이상 공개되지 않았습니다."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <JobDetail job={job} />;
}

function JobDetail({ job }: { job: JobDetailItem }) {
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
        backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.93), rgba(255,255,255,0.72), rgba(255,255,255,0.48)), url("${job.companyBackgroundUrl}")`,
      }
    : undefined;
  const experienceText = formatExperience(
    job.minExperienceYears,
    job.maxExperienceYears,
  );
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
          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <FileText size={15} className={styles.sectionIcon} />
              공고 정보
            </h2>
            <div className={styles.infoGrid}>
              <InfoItem label="직무군" value={jobFamilyLabels[job.jobFamily]} />
              <InfoItem label="고용형태" value={employmentLabels[job.employmentType]} />
              <InfoItem label="KICPA 조건" value={kicpaLabels[job.kicpaCondition]} />
              <InfoItem label="수습 CPA" value={traineeLabels[job.traineeStatus]} />
              <InfoItem label="실무수습기관" value={formatTrainingInstitution(job.practicalTrainingInstitution)} />
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
            {job.aiSuggestion ? (
              <div className="grid gap-3">
                <p className="text-sm leading-6 text-gray-700">{job.aiSuggestion.summary}</p>
                <ChipGroup title="추천 태그" items={job.aiSuggestion.tags} tone="pink" />
                <ChipGroup title="확인 필요" items={job.aiSuggestion.risks} tone="gray" />
              </div>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">
                아직 AI 요약이 없습니다. 추후 관리자 검수 후 요약과 태그가 표시됩니다.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <ScrollText size={15} className={styles.sectionIcon} />
              공고 본문
            </h2>
            <p className="whitespace-pre-line text-sm leading-7 text-neutral-700">{job.description}</p>
          </section>
        </div>

        <aside className={styles.aside}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <CheckCircle2 size={15} className={styles.sectionIcon} />
            출처 정보
          </h2>
          <div className="grid gap-3">
            <InfoItem label="출처" value={job.sourceName} />
            <InfoItem label="최종 확인" value={new Date(job.lastCheckedAt).toLocaleDateString("ko-KR")} />
            <InfoItem label="마감 유형" value={deadlineTypeLabels[job.deadlineType]} />
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
            <div className={styles.companyMiniIcon}>{job.companyName.charAt(0)}</div>
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
