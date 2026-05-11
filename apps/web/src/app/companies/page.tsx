"use client";

import type { CompanyListItem } from "@cpa/shared";
import {
  Bookmark,
  Building2,
  CircleDollarSign,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton } from "@/components/ui/action-button";
import { FilterInput, FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import {
  createMyBookmark,
  deleteMyBookmark,
  fetchCompanies,
  fetchCurrentUser,
  fetchMyBookmarks,
} from "@/lib/api";
import { companyTypeLabels } from "@/lib/labels";
import { companyDetailHref } from "@/lib/routes";
import styles from "./companies-page.module.css";

const companySortLabels = {
  name: "회사명순",
  employeeCountDesc: "직원수 많은순",
  averageSalaryDesc: "평균연봉 높은순",
  companyAgeDesc: "업력 높은순",
};

const PAGE_SIZE = 12;

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
  const [filterOpen, setFilterOpen] = useState(true);
  const [companyPage, setCompanyPage] = useState(1);
  const [bookmarkedCompanyIds, setBookmarkedCompanyIds] = useState<
    Set<string>
  >(new Set());
  const [isJobSeeker, setIsJobSeeker] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchCurrentUser()
      .then((user) => {
        if (ignore) return;
        if (user?.role === "JOB_SEEKER") {
          setIsJobSeeker(true);
          return fetchMyBookmarks("COMPANY").then((data) => {
            if (!ignore) {
              setBookmarkedCompanyIds(
                new Set(data.items.map((bookmark) => bookmark.targetId)),
              );
            }
          });
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  async function toggleCompanyBookmark(companyId: string) {
    if (!isJobSeeker) return;
    if (bookmarkedCompanyIds.has(companyId)) {
      try {
        const data = await fetchMyBookmarks("COMPANY");
        const bm = data.items.find((item) => item.targetId === companyId);
        if (bm) {
          await deleteMyBookmark(bm.id);
          setBookmarkedCompanyIds((prev) => {
            const next = new Set(prev);
            next.delete(companyId);
            return next;
          });
        }
      } catch {}
    } else {
      try {
        await createMyBookmark("COMPANY", companyId);
        setBookmarkedCompanyIds((prev) => new Set(prev).add(companyId));
      } catch {}
    }
  }

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

  // 필터 변경 시 페이지를 1로 리셋
  const companyParamsStr = useMemo(() => companyParams.toString(), [companyParams]);
  const isFirstCompanyRender = useRef(true);
  useEffect(() => {
    if (isFirstCompanyRender.current) {
      isFirstCompanyRender.current = false;
      return;
    }
    setCompanyPage(1);
  }, [companyParamsStr]);

  // 클라이언트 사이드 페이지네이션
  const pagedCompanies = useMemo(() => {
    const start = (companyPage - 1) * PAGE_SIZE;
    return companies.slice(start, start + PAGE_SIZE);
  }, [companies, companyPage]);
  const totalCompanyPages = Math.ceil(companies.length / PAGE_SIZE);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) setCompaniesLoading(true);
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">회사소개</h1>
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
            <ActionButton type="button" iconStart={<Search size={15} />}>
              검색
            </ActionButton>
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
                    <h3 className="mb-2 text-xs font-bold text-gray-800">
                      회사 유형
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: "", label: "전체" },
                        { value: "BIG4", label: "Big4" },
                        {
                          value: "LOCAL_ACCOUNTING_FIRM",
                          label: "로컬 회계법인",
                        },
                        {
                          value: "MID_SMALL_ACCOUNTING_FIRM",
                          label: "중소 회계법인",
                        },
                        { value: "FINANCIAL_COMPANY", label: "금융사" },
                        { value: "GENERAL_COMPANY", label: "일반 기업" },
                        { value: "PUBLIC_INSTITUTION", label: "공공기관" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={companyListType === opt.value}
                            onChange={() =>
                              setCompanyListType(
                                companyListType === opt.value &&
                                  opt.value !== ""
                                  ? ""
                                  : opt.value,
                              )
                            }
                            className="h-3.5 w-3.5 accent-[#E8457A]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 채용 상태 */}
                  <div className="min-w-[80px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">
                      채용 상태
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: "", label: "전체" },
                        { value: "true", label: "채용 중" },
                        { value: "false", label: "공고 없음" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={hasOpenJobs === opt.value}
                            onChange={() =>
                              setHasOpenJobs(
                                hasOpenJobs === opt.value && opt.value !== ""
                                  ? ""
                                  : opt.value,
                              )
                            }
                            className="h-3.5 w-3.5 accent-[#E8457A]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 태그 */}
                  <FilterInput
                    label="태그"
                    value={companyTag}
                    placeholder="ESG, 감사"
                    onChange={setCompanyTag}
                  />

                  {/* 직원수 */}
                  <FilterSelect
                    label="직원수 (명)"
                    value={`${minEmployeeCount}~${maxEmployeeCount}`}
                    options={[
                      { label: "무관", value: "~" },
                      { label: "~50명", value: "~50" },
                      { label: "50~200명", value: "50~200" },
                      { label: "200~1000명", value: "200~1000" },
                      { label: "1000명+", value: "1000~" },
                    ]}
                    onChange={(v) => {
                      const [min, max] = v.split("~");
                      setMinEmployeeCount(min === undefined ? "" : min);
                      setMaxEmployeeCount(max === undefined ? "" : max);
                    }}
                  />

                  {/* 평균연봉 */}
                  <FilterSelect
                    label="평균연봉 (만원)"
                    value={`${minAverageSalary}~${maxAverageSalary}`}
                    options={[
                      { label: "무관", value: "~" },
                      { label: "~3000만", value: "~3000" },
                      { label: "3000~5000만", value: "3000~5000" },
                      { label: "5000~7000만", value: "5000~7000" },
                      { label: "7000만+", value: "7000~" },
                    ]}
                    onChange={(v) => {
                      const [min, max] = v.split("~");
                      setMinAverageSalary(min === undefined ? "" : min);
                      setMaxAverageSalary(max === undefined ? "" : max);
                    }}
                  />

                  {/* 업력 */}
                  <FilterSelect
                    label="업력 (년)"
                    value={`${companyMinAgeYears}~${companyMaxAgeYears}`}
                    options={[
                      { label: "무관", value: "~" },
                      { label: "~3년", value: "~3" },
                      { label: "3~7년", value: "3~7" },
                      { label: "7~15년", value: "7~15" },
                      { label: "15년+", value: "15~" },
                    ]}
                    onChange={(v) => {
                      const [min, max] = v.split("~");
                      setCompanyMinAgeYears(min === undefined ? "" : min);
                      setCompanyMaxAgeYears(max === undefined ? "" : max);
                    }}
                  />

                  {/* 퇴사율 */}
                  <FilterSelect
                    label="퇴사율 이하"
                    value={companyMaxAttritionRate}
                    options={[
                      { label: "무관", value: "" },
                      { label: "5% 이하", value: "5" },
                      { label: "10% 이하", value: "10" },
                      { label: "20% 이하", value: "20" },
                    ]}
                    onChange={setCompanyMaxAttritionRate}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats + sort row */}
        {!companiesLoading && (
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                회사{" "}
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
        )}

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
        ) : pagedCompanies.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                bookmarked={bookmarkedCompanyIds.has(company.id)}
                onToggleBookmark={
                  isJobSeeker ? toggleCompanyBookmark : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--app-line)] bg-white p-10 text-center text-sm text-[var(--app-muted)]">
            검색 조건에 맞는 회사가 없습니다.
          </div>
        )}
        {!companiesLoading && (
          <Pagination
            page={companyPage}
            totalPages={totalCompanyPages}
            onPageChange={setCompanyPage}
          />
        )}
      </div>
    </main>
  );
}

function CompanyCard({
  company,
  bookmarked,
  onToggleBookmark,
}: {
  company: CompanyListItem;
  bookmarked?: boolean;
  onToggleBookmark?: (companyId: string) => void;
}) {
  const initial = company.name.charAt(0);
  const hasJobs = company.openJobCount > 0;

  return (
    <Link href={companyDetailHref(company.id)} className={styles.companyCard}>
      <div className={styles.banner}>
        {company.backgroundUrl ? (
          <>
            <img
              src={company.backgroundUrl}
              alt=""
              aria-hidden="true"
              className={styles.bannerImage}
            />
            <div className={styles.bannerOverlay} />
          </>
        ) : null}
        {hasJobs && (
          <span className={styles.openBadge}>
            채용 중 {company.openJobCount}
          </span>
        )}
        <div className={styles.logo}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} />
          ) : (
            initial
          )}
        </div>
      </div>

      <div className={styles.body}>
        <span className={styles.typeBadge}>
          {companyTypeLabels[company.type]}
        </span>
        <h3 className={styles.title}>{company.name}</h3>
        <p className={styles.description}>
          {company.description ?? "회사 소개가 준비 중입니다."}
        </p>

        <div className={styles.factGrid}>
          <CompanyFact
            icon={Building2}
            text={formatCompanyAge(company.foundedYear)}
          />
          <CompanyFact
            icon={Users}
            text={
              company.employeeCount
                ? `${company.employeeCount.toLocaleString("ko-KR")}명`
                : "미공개"
            }
          />
          <CompanyFact
            icon={CircleDollarSign}
            text={formatSalary(company.averageSalary)}
          />
          <CompanyFact
            icon={TrendingDown}
            text={`퇴사율 ${formatRate(company.recentAttritionRate)}`}
          />
        </div>

        {company.tags.length > 0 && (
          <div className={styles.tags}>
            {company.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.cardActions}>
          {onToggleBookmark && (
            <button
              type="button"
              className={styles.bookmarkBtn}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleBookmark(company.id);
              }}
              aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
            >
              <Bookmark
                size={16}
                fill={bookmarked ? "#facc15" : "none"}
                stroke={bookmarked ? "#facc15" : "currentColor"}
              />
            </button>
          )}
        </div>
      </div>
    </Link>
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
