"use client";

import type { CompanyDetailItem } from "@cpa/shared";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe2,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { CompanyJobCard } from "./_components/company-job-card";
import { IconInfo } from "./_components/icon-info";
import { EmployeeTrendChart } from "./_components/employee-trend-chart";
import {
  formatCompanyAge,
  formatRate,
  formatSalary,
} from "./_lib/company-detail-utils";
import { SiteNav } from "@/components/site-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InfoItem } from "@/components/ui/info-item";
import { actionButtonClassName } from "@/components/ui/action-button";
import { fetchCompanyDetail } from "@/lib/api";
import { logClientError } from "@/lib/client-logger";
import { companyTypeLabels } from "@/lib/labels";
import styles from "./company-detail.module.css";

export function CompanyDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [company, setCompany] = useState<CompanyDetailItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let ignore = false;
    fetchCompanyDetail(id)
      .then((data) => {
        if (!ignore) {
          setCompany(data);
          setError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("companies.detail_load_failed", caught, {
            companyId: id,
          });
          setError(caught.message);
        }
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
            <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-medium text-red-700">
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">회사를 찾을 수 없습니다.</h1>
            <p className="mt-1 text-sm text-red-700">회사 ID가 누락되었습니다.</p>
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
            회사 상세를 불러오는 중입니다.
          </div>
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.body}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-medium text-red-700">
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-red-900">회사를 찾을 수 없습니다.</h1>
            <p className="mt-1 text-sm text-red-700">
              {error || "요청한 회사가 없거나 아직 공개되지 않았습니다."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <CompanyDetail company={company} />;
}

function CompanyDetail({ company }: { company: CompanyDetailItem }) {
  const initial = company.name.charAt(0);
  const heroStyle: CSSProperties | undefined = company.backgroundUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.93), rgba(255,255,255,0.72), rgba(255,255,255,0.48)), url("${company.backgroundUrl}")`,
      }
    : undefined;

  useEffect(() => {
    if (window.location.hash !== "#open-jobs") return;
    window.requestAnimationFrame(() => {
      document.getElementById("open-jobs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />
      <Breadcrumb
        items={[{ label: "회사소개", href: "/companies" }]}
        current={company.name}
      />

      <div className={styles.hero} style={heroStyle}>
        <div className={styles.heroGlow} />
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link
            href="/companies"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ArrowLeft size={13} />
            회사 목록
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-3">
              <div className={styles.logo}>
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} />
                ) : (
                  initial
                )}
              </div>
              <div>
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  <span className={styles.typeBadge}>
                    {companyTypeLabels[company.type]}
                  </span>
                  <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                    {company.openJobCount > 0
                      ? `채용 중 ${company.openJobCount}건`
                      : "현재 공고 없음"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.name}
                </h1>
                <p className="mt-0.5 max-w-2xl text-sm text-gray-600">
                  {company.description ?? "회사 소개가 준비 중입니다."}
                </p>
              </div>
            </div>

            {company.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className={actionButtonClassName({ size: "md" })}
              >
                홈페이지
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </div>

      <section className={styles.body}>
        <div className="grid gap-4">
          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Building2 size={15} className={styles.sectionIcon} />
              회사 정보
            </h2>
            <div className={styles.infoGrid}>
              <InfoItem label="업력" value={formatCompanyAge(company.foundedYear)} />
              <InfoItem label="직원수" value={company.employeeCount ? `${company.employeeCount.toLocaleString("ko-KR")}명` : "미공개"} />
              <InfoItem label="평균연봉" value={formatSalary(company.averageSalary)} />
              <InfoItem label="최근 퇴사율" value={formatRate(company.recentAttritionRate)} />
              <InfoItem label="사업자번호" value={company.businessNumber ?? "미공개"} />
              <InfoItem label="회사 유형" value={companyTypeLabels[company.type]} />
              <InfoItem label="홈페이지" value={company.websiteUrl ? "연결 가능" : "미공개"} />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <TrendingUp size={15} className={styles.sectionIcon} />
              직원수 추이
            </h2>
            <EmployeeTrendChart data={company.employeeTrend} />
          </section>

          <section id="open-jobs" className={styles.section}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <BriefcaseBusiness size={15} className={styles.sectionIcon} />
              진행 중인 공고
            </h2>
            <div className="grid gap-2">
              {company.openJobs.length ? (
                company.openJobs.map((job) => <CompanyJobCard key={job.id} job={job} />)
              ) : (
                <p className={styles.emptyJobs}>
                  현재 게시 중인 공고는 없습니다. 회사 프로필은 계속 확인할 수 있습니다.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.aside}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Globe2 size={15} className={styles.sectionIcon} />
            외부 링크
          </h2>
          <div className="grid gap-2">
            {company.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.externalLink}
              >
                회사 홈페이지 열기
                <ExternalLink size={14} />
              </a>
            )}
            {company.externalLinks.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className={styles.externalLink}
              >
                관련 링크
                <ExternalLink size={14} />
              </a>
            ))}
          </div>

          <div className={styles.sidebarInfoSection}>
            <IconInfo icon={<Users size={14} />} label="직원수" value={company.employeeCount ? `${company.employeeCount.toLocaleString("ko-KR")}명` : "미공개"} />
            <IconInfo icon={<WalletCards size={14} />} label="평균연봉" value={formatSalary(company.averageSalary)} />
            <IconInfo icon={<CalendarDays size={14} />} label="설립연도" value={company.foundedYear ? `${company.foundedYear}년` : "미공개"} />
          </div>

          {company.tags.length > 0 && (
            <div className={styles.tagsSection}>
              <p className={styles.tagsTitle}>태그</p>
              <div className={styles.tagsList}>
                {company.tags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
