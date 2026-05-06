"use client";

import type { CompanyListItem } from "@cpa/shared";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { fetchCompanies } from "@/lib/api";
import { companyTypeLabels } from "@/lib/labels";
import styles from "./companies-page.module.css";

const companySortLabels = {
  name: "회사명순",
  employeeCountDesc: "직원수 많은순",
  averageSalaryDesc: "평균연봉 높은순",
  companyAgeDesc: "업력 높은순",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyListType, setCompanyListType] = useState("");
  const [companyTag, setCompanyTag] = useState("");
  const [hasOpenJobs, setHasOpenJobs] = useState("");
  const [minEmployeeCount, setMinEmployeeCount] = useState("");
  const [maxEmployeeCount, setMaxEmployeeCount] = useState("");
  const [minAverageSalary, setMinAverageSalary] = useState("");
  const [maxAverageSalary, setMaxAverageSalary] = useState("");
  const [companyMinAgeYears, setCompanyMinAgeYears] = useState("");
  const [companyMaxAgeYears, setCompanyMaxAgeYears] = useState("");
  const [companyMaxAttritionRate, setCompanyMaxAttritionRate] = useState("");
  const [companySort, setCompanySort] = useState("name");
  const [companyError, setCompanyError] = useState("");
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyOpenTotal, setCompanyOpenTotal] = useState(0);
  const [companyNoJobTotal, setCompanyNoJobTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const companyParams = useMemo(() => {
    const next = new URLSearchParams({ sort: companySort });
    if (companySearch) next.set("search", companySearch);
    if (companyListType) next.set("companyType", companyListType);
    if (companyTag) next.set("tag", companyTag);
    if (hasOpenJobs) next.set("hasOpenJobs", hasOpenJobs);
    if (minEmployeeCount) next.set("minEmployeeCount", minEmployeeCount);
    if (maxEmployeeCount) next.set("maxEmployeeCount", maxEmployeeCount);
    if (minAverageSalary) next.set("minAverageSalary", minAverageSalary);
    if (maxAverageSalary) next.set("maxAverageSalary", maxAverageSalary);
    if (companyMinAgeYears) next.set("minCompanyAgeYears", companyMinAgeYears);
    if (companyMaxAgeYears) next.set("maxCompanyAgeYears", companyMaxAgeYears);
    if (companyMaxAttritionRate)
      next.set("maxAttritionRate", companyMaxAttritionRate);
    return next;
  }, [
    companyListType,
    companyMaxAgeYears,
    companyMaxAttritionRate,
    companyMinAgeYears,
    companySearch,
    companySort,
    companyTag,
    hasOpenJobs,
    maxAverageSalary,
    maxEmployeeCount,
    minAverageSalary,
    minEmployeeCount,
  ]);

  useEffect(() => {
    let ignore = false;
    fetchCompanies(companyParams)
      .then((data) => {
        if (!ignore) {
          setCompanies(data.items);
          setCompanyTotal(data.total);
          setCompanyOpenTotal(data.openTotal);
          setCompanyNoJobTotal(data.noJobTotal);
          setCompanyError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) setCompanyError(caught.message);
      })
      .finally(() => {
        if (!ignore) setCompaniesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [companyParams]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      {/* 페이지 헤더 — 배경색 통일 */}
      <div className="border-b border-[var(--app-line)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">회사 탐색</h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            현재 공고가 없는 회사까지 포함해 회사 프로필을 확인하세요.
          </p>

          {/* 검색바 */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="회사명, 유형, 태그로 검색"
                className="w-full rounded-xl border border-[var(--app-line)] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
            <ActionButton
              type="button"
              iconStart={<Search size={15} />}
            >
              검색
            </ActionButton>
            <select
              value={companySort}
              onChange={(e) => setCompanySort(e.target.value)}
              className="rounded-xl border border-[var(--app-line)] bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none"
            >
              {Object.entries(companySortLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 필터 카드 */}
        <div className="mx-auto max-w-7xl px-6 pb-4">
          <div className="rounded-2xl border border-[var(--app-line)] bg-white">
            {/* 필터 헤더 */}
            <div className="flex items-center justify-between px-5 py-3">
              <ActionButton
                type="button"
                onClick={() => setFilterOpen((prev) => !prev)}
                variant="ghost"
                size="sm"
                className={styles.filterHeaderButton}
                iconStart={<SlidersHorizontal size={15} />}
              >
                필터
                <span className="text-xs font-medium text-gray-400">
                  {filterOpen ? "필터 닫기 ∧" : "필터 열기 ∨"}
                </span>
              </ActionButton>
              {filterOpen && (
                <ActionButton
                  type="button"
                  onClick={() => {
                    setCompanyListType("");
                    setCompanyTag("");
                    setHasOpenJobs("");
                    setMinEmployeeCount("");
                    setMaxEmployeeCount("");
                    setMinAverageSalary("");
                    setMaxAverageSalary("");
                    setCompanyMinAgeYears("");
                    setCompanyMaxAgeYears("");
                    setCompanyMaxAttritionRate("");
                  }}
                  variant="ghost"
                  size="sm"
                  iconStart={<RefreshCw size={12} />}
                >
                  필터 초기화
                </ActionButton>
              )}
            </div>

            {/* 체크박스 필터 컬럼들 */}
            {filterOpen && (
              <div className="overflow-x-auto border-t border-[var(--app-line)] px-5 py-4">
                <div className="flex gap-8">
                  {/* 회사 유형 */}
                  <div className="min-w-[120px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">회사 유형</h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: "", label: "전체" },
                        { value: "BIG4", label: "Big4" },
                        { value: "LOCAL_ACCOUNTING_FIRM", label: "로컬 회계법인" },
                        { value: "MID_SMALL_ACCOUNTING_FIRM", label: "중소 회계법인" },
                        { value: "FINANCIAL_COMPANY", label: "금융사" },
                        { value: "GENERAL_COMPANY", label: "일반 기업" },
                        { value: "PUBLIC_INSTITUTION", label: "공공기관" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={companyListType === opt.value}
                            onChange={() => setCompanyListType(companyListType === opt.value && opt.value !== "" ? "" : opt.value)}
                            className="h-3.5 w-3.5 accent-[#E8457A]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 채용 상태 */}
                  <div className="min-w-[80px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">채용 상태</h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: "", label: "전체" },
                        { value: "true", label: "채용 중" },
                        { value: "false", label: "공고 없음" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={hasOpenJobs === opt.value}
                            onChange={() => setHasOpenJobs(hasOpenJobs === opt.value && opt.value !== "" ? "" : opt.value)}
                            className="h-3.5 w-3.5 accent-[#E8457A]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 태그 */}
                  <div className="min-w-[120px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">태그</h3>
                    <input
                      value={companyTag}
                      onChange={(e) => setCompanyTag(e.target.value)}
                      placeholder="ESG, 감사"
                      className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                    />
                  </div>

                  {/* 직원수 */}
                  <div className="min-w-[120px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">직원수 (명)</h3>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number" min={0}
                        value={minEmployeeCount}
                        onChange={(e) => setMinEmployeeCount(e.target.value)}
                        placeholder="최소"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                      <input
                        type="number" min={0}
                        value={maxEmployeeCount}
                        onChange={(e) => setMaxEmployeeCount(e.target.value)}
                        placeholder="최대"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  </div>

                  {/* 평균연봉 */}
                  <div className="min-w-[120px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">평균연봉 (만원)</h3>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number" min={0}
                        value={minAverageSalary}
                        onChange={(e) => setMinAverageSalary(e.target.value)}
                        placeholder="최소"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                      <input
                        type="number" min={0}
                        value={maxAverageSalary}
                        onChange={(e) => setMaxAverageSalary(e.target.value)}
                        placeholder="최대"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  </div>

                  {/* 업력 */}
                  <div className="min-w-[100px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">업력 (년)</h3>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number" min={0}
                        value={companyMinAgeYears}
                        onChange={(e) => setCompanyMinAgeYears(e.target.value)}
                        placeholder="최소"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                      <input
                        type="number" min={0}
                        value={companyMaxAgeYears}
                        onChange={(e) => setCompanyMaxAgeYears(e.target.value)}
                        placeholder="최대"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  </div>

                  {/* 퇴사율 */}
                  <div className="min-w-[100px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">퇴사율 이하</h3>
                    <input
                      type="number" min={0}
                      value={companyMaxAttritionRate}
                      onChange={(e) => setCompanyMaxAttritionRate(e.target.value)}
                      placeholder="10%"
                      className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats row */}
        <div className="mb-5 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>
            전체{" "}
            <strong className="text-gray-900">
              {companyTotal.toLocaleString("ko-KR")}
            </strong>
            개
          </span>
          <span>
            채용 중{" "}
            <strong className={styles.brandText}>
              {companyOpenTotal.toLocaleString("ko-KR")}
            </strong>
            개
          </span>
          <span>
            공고 없음{" "}
            <strong className="text-gray-900">
              {companyNoJobTotal.toLocaleString("ko-KR")}
            </strong>
            개
          </span>
        </div>

        {companyError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {companyError} API 서버가 실행 중인지 확인해 주세요.
          </div>
        )}

        {companiesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : companies.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--app-line)] bg-white p-10 text-center text-sm text-[var(--app-muted)]">
            검색 조건에 맞는 회사가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}

function CompanyCard({ company }: { company: CompanyListItem }) {
  const initial = company.name.charAt(0);
  const hasJobs = company.openJobCount > 0;

  return (
    <article className={styles.companyCard}>
      <div className={styles.banner}>
        {hasJobs && (
          <span className={styles.openBadge}>
            채용 중 {company.openJobCount}
          </span>
        )}
        <div className={styles.logo}>
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
            />
          ) : (
            initial
          )}
        </div>
      </div>

      <div className={styles.body}>
        <span className={styles.typeBadge}>{companyTypeLabels[company.type]}</span>
        <h3 className={styles.title}>{company.name}</h3>
        <p className={styles.description}>
          {company.description ?? "회사 소개가 준비 중입니다."}
        </p>

        <div className={styles.factGrid}>
          <CompanyFact icon={Building2} text={formatCompanyAge(company.foundedYear)} />
          <CompanyFact
            icon={Users}
            text={
              company.employeeCount
                ? `${company.employeeCount.toLocaleString("ko-KR")}명`
                : "미공개"
            }
          />
          <CompanyFact icon={CircleDollarSign} text={formatSalary(company.averageSalary)} />
          <CompanyFact
            icon={TrendingDown}
            text={`퇴사율 ${formatRate(company.recentAttritionRate)}`}
          />
        </div>

        {company.tags.length > 0 && (
          <div className={styles.tags}>
            {company.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={styles.tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <ActionLink
          href={`/companies/${company.id}`}
          size="sm"
          className={styles.cardAction}
          iconEnd={<ArrowRight size={13} />}
        >
          상세 보기
        </ActionLink>
      </div>
    </article>
  );
}

function CompanyFact({
  icon: Icon,
  text,
}: {
  icon: typeof Building2;
  text: string;
}) {
  return (
    <span className={styles.fact}>
      <Icon size={13} />
      <span>{text}</span>
    </span>
  );
}

function formatCompanyAge(foundedYear: number | null) {
  if (!foundedYear) return "미공개";
  const years = new Date().getFullYear() - foundedYear + 1;
  return `${years.toLocaleString("ko-KR")}년차`;
}

function formatSalary(salary: number | null) {
  if (!salary) return "미공개";
  return `${salary.toLocaleString("ko-KR")}만원`;
}

function formatRate(rate: number | null) {
  if (rate === null) return "미공개";
  return `${rate.toLocaleString("ko-KR")}%`;
}
