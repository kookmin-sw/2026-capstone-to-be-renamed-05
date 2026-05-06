"use client";

import type { JobDetailItem } from "@cpa/shared";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { actionButtonClassName } from "@/components/ui/action-button";
import { fetchJobDetail } from "@/lib/api";
import {
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "./job-detail.module.css";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [job, setJob] = useState<JobDetailItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchJobDetail(id)
      .then((data) => {
        if (!ignore) {
          setJob(data);
          setError("");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="animate-pulse rounded-2xl border border-[var(--app-line)] bg-white p-6 text-sm text-[var(--app-muted)]">
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
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700"
            >
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-red-900">
              공고를 찾을 수 없습니다.
            </h1>
            <p className="mt-2 text-sm text-red-700">
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

  const experienceText = useMemo(() => {
    if (job.minExperienceYears === null && job.maxExperienceYears === null)
      return "불명확";
    if (job.minExperienceYears !== null && job.maxExperienceYears !== null) {
      return `${job.minExperienceYears}~${job.maxExperienceYears}년`;
    }
    if (job.minExperienceYears !== null)
      return `${job.minExperienceYears}년 이상`;
    return `${job.maxExperienceYears}년 이하`;
  }, [job.maxExperienceYears, job.minExperienceYears]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      {/* Pink gradient hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link
            href="/jobs"
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ArrowLeft size={14} />
            채용공고 목록
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              {/* Company logo / initial */}
              <div className={styles.logo}>
                {job.companyLogoUrl ? (
                  <img
                    src={job.companyLogoUrl}
                    alt={job.companyName}
                  />
                ) : (
                  initial
                )}
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      styles.dDay,
                      isUrgent ? styles.dDayUrgent : styles.dDayMuted,
                    )}
                  >
                    {dDayLabel}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                    {companyTypeLabels[job.companyType]}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                    {jobFamilyLabels[job.jobFamily]}
                  </span>
                </div>
                <Link
                  href={`/companies/${job.companyId}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--brand)]"
                >
                  <BriefcaseBusiness size={15} />
                  {job.companyName}
                </Link>
                <h1 className="mt-1 max-w-3xl text-2xl font-black leading-snug text-gray-900">
                  {job.title}
                </h1>
              </div>
            </div>

            <a
              href={job.originalUrl}
              target="_blank"
              rel="noreferrer"
              className={actionButtonClassName({ size: "lg" })}
            >
              원문에서 지원
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5">
          {/* Info grid */}
          <section className="rounded-2xl border border-[var(--app-line)] bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <FileText size={17} className={styles.sectionIcon} />
              공고 정보
            </h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="직무군" value={jobFamilyLabels[job.jobFamily]} />
              <Info
                label="고용형태"
                value={employmentLabels[job.employmentType]}
              />
              <Info
                label="KICPA 조건"
                value={kicpaLabels[job.kicpaCondition]}
              />
              <Info label="수습 CPA" value={traineeLabels[job.traineeStatus]} />
              <Info
                label="실무수습기관"
                value={trainingInstitutionText(
                  job.practicalTrainingInstitution,
                )}
              />
              <Info label="요구 경력" value={experienceText} />
              <Info label="지역" value={job.location ?? "불명확"} />
              <Info label="마감일" value={deadlineDisplay(job)} />
            </div>
          </section>

          {/* AI 요약 — pink background */}
          <section className={styles.aiSummary}>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--brand)]">
              <Sparkles size={17} />
              AI 요약
            </h2>
            {job.aiSuggestion ? (
              <div className="grid gap-4">
                <p className="text-sm leading-7 text-gray-800">
                  {job.aiSuggestion.summary}
                </p>
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
              </div>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">
                아직 AI 요약이 없습니다. 추후 관리자 검수 후 요약과 태그가
                표시됩니다.
              </p>
            )}
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-[var(--app-line)] bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">공고 본문</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-neutral-800">
              {job.description}
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-[var(--app-line)] bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <CheckCircle2 size={17} className={styles.sectionIcon} />
            출처 정보
          </h2>
          <div className="grid gap-3 text-sm">
            <Info label="출처" value={job.sourceName} />
            <Info
              label="최종 확인"
              value={new Date(job.lastCheckedAt).toLocaleString("ko-KR")}
            />
            <Info
              label="마감 유형"
              value={deadlineTypeLabels[job.deadlineType]}
            />
          </div>
          <a
            href={job.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm font-medium transition-colors hover:border-gray-400"
          >
            원문 링크 열기
            <ExternalLink size={15} />
          </a>

          <div className="mt-5 border-t border-[var(--app-line)] pt-4">
            <h3 className="mb-2 text-sm font-semibold">라벨</h3>
            <div className="flex flex-wrap gap-2">
              {job.labels.length ? (
                job.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[var(--app-line)] px-2 py-1 text-xs"
                  >
                    #{label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--app-muted)]">
                  라벨 없음
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/companies/${job.companyId}`}
            className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--app-line)] p-3 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            <div className={styles.companyMiniIcon}>
              {job.companyName.charAt(0)}
            </div>
            <span className="flex items-center gap-2">
              <Building2 size={15} />
              회사 상세 보기
            </span>
          </Link>
        </aside>
      </section>
    </main>
  );
}

function deadlineDisplay(job: JobDetailItem) {
  if (!job.deadline) return deadlineTypeLabels[job.deadlineType];
  const date = new Date(job.deadline).toLocaleDateString("ko-KR");
  if (job.dDay === null) return date;
  if (job.dDay < 0) return `${date} · 마감`;
  if (job.dDay === 0) return `${date} · 오늘 마감`;
  return `${date} · D-${job.dDay}`;
}

function trainingInstitutionText(value: boolean | null) {
  if (value === true) return "인정 가능";
  if (value === false) return "인정 불가";
  return "확인 필요";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--app-line)] bg-[#fbfbf8] px-3 py-2.5">
      <p className="text-xs text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ChipGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "pink" | "gray";
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className={cn("mb-2 text-sm font-bold", tone === "pink" && styles.brandText)}>
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={
              tone === "pink"
                ? styles.chipBrand
                : "rounded-full border border-[var(--app-line)] bg-white px-3 py-1 text-xs font-semibold text-gray-600"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
