"use client";

import type { JobCalendarDay, JobListItem } from "@cpa/shared";
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JobGridCard } from "@/components/job-card";
import { jobSortLabels } from "@/components/job-filter-panel";
import { SiteNav } from "@/components/site-nav";
import { ActionButton } from "@/components/ui/action-button";
import { useJobFilterState } from "@/hooks/use-job-filter-state";
import { fetchJobCalendar, fetchJobs } from "@/lib/api";
import { calendarDaysToMap, jobsBetween } from "@/lib/calendar-data";
import {
  endOfWeek,
  getCalendarGridRange,
  isSameDay,
  startOfWeek,
  toDateKey,
} from "@/lib/date-utils";
import {
  buildJobFilterParams,
  defaultJobFilters,
  type JobFilterState,
} from "@/lib/job-filters";
import {
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "./jobs-page.module.css";

/* ── 일요일 시작 캘린더 그리드 ── */
function getSundayFirstGrid(monthDate: Date): Date[] {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/* ── 사이드바 캘린더 컴포넌트 ── */
function JobsSidebarCalendar({
  monthDate,
  dayMap,
  urgentJobs,
  calendarHref,
  onMonthChange,
}: {
  monthDate: Date;
  dayMap: Record<string, JobCalendarDay>;
  urgentJobs: JobListItem[];
  calendarHref: string;
  onMonthChange: (date: Date) => void;
}) {
  const days = useMemo(() => getSundayFirstGrid(monthDate), [monthDate]);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* 캘린더 카드 */}
      <div className="rounded-2xl bg-white p-5 shadow-md">
        {/* 제목 */}
        <div className="mb-3 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-gray-900">마감일 캘린더</span>
        </div>

        {/* 월 이동 */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              onMonthChange(
                new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
              )
            }
            className={styles.iconButton}
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-gray-800">
            {monthDate.getFullYear()}년 {monthDate.getMonth() + 1}월
          </span>
          <button
            type="button"
            onClick={() =>
              onMonthChange(
                new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
              )
            }
            className={styles.iconButton}
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="mb-1 grid grid-cols-7">
          {WEEK_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(styles.weekLabel, i === 0 && styles.weekLabelSunday)}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const inMonth = day.getMonth() === monthDate.getMonth();
            const isToday = isSameDay(day, today);
            const count = dayMap[dateKey]?.total ?? 0;
            const isSun = day.getDay() === 0;
            const isSelected = selectedDate === dateKey;
            const isClickable = inMonth && count > 0;

            const cellContent = (
              <>
                <span
                  className={cn(
                    styles.dayNumber,
                    isToday && styles.dayToday,
                    !inMonth && styles.dayMuted,
                    isSun && !isToday && inMonth && styles.daySunday,
                  )}
                >
                  {day.getDate()}
                </span>
                <span
                  className={styles.dayCount}
                >
                  {inMonth && count > 0 ? count : ""}
                </span>
              </>
            );

            if (isClickable) {
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() =>
                    setSelectedDate(isSelected ? null : dateKey)
                  }
                  className={cn(
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                  )}
                >
                  {cellContent}
                </button>
              );
            }
            return (
              <div key={dateKey} className="flex flex-col items-center py-1">
                {cellContent}
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 공고 카드 */}
      {selectedDate && dayMap[selectedDate] && (
        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              {(() => {
                const [, m, d] = selectedDate.split("-");
                return `${parseInt(m)}월 ${parseInt(d)}일 마감 공고`;
              })()}
              <span className="ml-1.5 text-xs font-medium text-gray-400">
                ({dayMap[selectedDate].total}건)
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="divide-y divide-[var(--app-line)]">
            {dayMap[selectedDate].jobs.slice(0, 10).map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-1 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-900">
                    {job.companyName}
                  </p>
                  <p className="truncate text-[10px] text-gray-400">
                    {jobFamilyLabels[job.jobFamily]} |{" "}
                    {employmentLabels[job.employmentType]} |{" "}
                    {kicpaLabels[job.kicpaCondition]}
                  </p>
                </div>
                <ArrowRight size={12} className="shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* D-7 마감 임박 카드 */}
      <div className="rounded-2xl bg-white p-5 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">
            D-7 마감 임박 공고
          </span>
          <Link
            href={calendarHref}
            className={styles.sidebarMore}
          >
            전체 보기 <ArrowRight size={12} />
          </Link>
        </div>

        {urgentJobs.length > 0 ? (
          <div className="divide-y divide-[var(--app-line)]">
            {urgentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-1 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-900">
                    {job.companyName}
                  </p>
                  <p className="truncate text-[10px] text-gray-400">
                    {jobFamilyLabels[job.jobFamily]} |{" "}
                    {employmentLabels[job.employmentType]} |{" "}
                    {kicpaLabels[job.kicpaCondition]}
                  </p>
                </div>
                <span className={styles.sidebarDday}>
                  {job.dDay === 0 ? "D-Day" : `D-${job.dDay}`}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            D-7 이내 마감 임박 공고가 없습니다.
          </p>
        )}
        <p className="mt-3 text-[10px] text-gray-400">
          * D-day는 마감일 기준입니다.
        </p>
      </div>
    </div>
  );
}

/* ── 필터 체크박스 컬럼 ── */
const JOB_FAMILY_OPTS = [
  { value: "AUDIT", label: "감사" },
  { value: "TAX", label: "세무" },
  { value: "FAS", label: "FAS" },
  { value: "DEAL", label: "Deal" },
  { value: "INTERNAL_ACCOUNTING", label: "내부회계" },
  { value: "IN_HOUSE", label: "인하우스" },
];
const COMPANY_TYPE_OPTS = [
  { value: "BIG4", label: "Big4" },
  { value: "LOCAL_ACCOUNTING_FIRM", label: "로컬 회계법인" },
  { value: "MID_SMALL_ACCOUNTING_FIRM", label: "중소 회계법인" },
  { value: "FINANCIAL_COMPANY", label: "금융사" },
  { value: "GENERAL_COMPANY", label: "일반 기업" },
  { value: "PUBLIC_INSTITUTION", label: "공공기관" },
];
const EMPLOYMENT_OPTS = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" },
  { value: "PART_TIME", label: "파트타임" },
];
const KICPA_OPTS = [
  { value: "REQUIRED", label: "필수" },
  { value: "PREFERRED", label: "우대" },
  { value: "NONE", label: "무관" },
  { value: "UNCLEAR", label: "불명확" },
];
const DEADLINE_TYPE_OPTS = [
  { value: "FIXED_DATE", label: "특정일 마감" },
  { value: "UNTIL_FILLED", label: "채용시 마감" },
  { value: "ALWAYS_OPEN", label: "상시채용" },
];
const TRAINEE_OPTS = [
  { value: "AVAILABLE", label: "가능" },
  { value: "UNAVAILABLE", label: "불가능" },
  { value: "UNCLEAR", label: "불명확" },
];

function CheckboxColumn({
  title,
  field,
  options,
  filters,
  onChange,
}: {
  title: string;
  field: keyof JobFilterState;
  options: { value: string; label: string }[];
  filters: JobFilterState;
  onChange: (f: JobFilterState) => void;
}) {
  const current = filters[field] as string;
  return (
    <div className="min-w-[100px]">
      <h3 className="mb-2 text-xs font-bold text-gray-800">{title}</h3>
      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={current === ""}
            onChange={() => onChange({ ...filters, [field]: "" })}
            className="h-3.5 w-3.5 accent-[#E8457A]"
          />
          전체
        </label>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-xs text-gray-700"
          >
            <input
              type="checkbox"
              checked={current === opt.value}
              onChange={() =>
                onChange({
                  ...filters,
                  [field]: current === opt.value ? "" : opt.value,
                })
              }
              className="h-3.5 w-3.5 accent-[#E8457A]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [miniMonth, setMiniMonth] = useState(() => new Date());
  const [calendarDays, setCalendarDays] = useState<JobCalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const { filters, setFilters, ready, queryString } = useJobFilterState();

  const params = useMemo(() => buildJobFilterParams(filters), [filters]);

  const calendarRange = useMemo(() => {
    const grid = getCalendarGridRange(miniMonth);
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    return {
      from: grid.from < weekStart ? grid.from : weekStart,
      to: grid.to > weekEnd ? grid.to : weekEnd,
    };
  }, [miniMonth]);

  const calendarParams = useMemo(() => {
    const next = buildJobFilterParams(filters);
    next.set("from", toDateKey(calendarRange.from));
    next.set("to", toDateKey(calendarRange.to));
    return next;
  }, [calendarRange, filters]);

  useEffect(() => {
    if (!ready) return;
    let ignore = false;
    fetchJobs(params)
      .then((data) => {
        if (!ignore) {
          setJobs(data.items);
          setTotal(data.total);
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
  }, [params, ready]);

  useEffect(() => {
    if (!ready) return;
    let ignore = false;
    fetchJobCalendar(calendarParams)
      .then((data) => {
        if (!ignore) {
          setCalendarDays(data.days);
          setCalendarError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) setCalendarError(caught.message);
      })
      .finally(() => {
        if (!ignore) setCalendarLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [calendarParams, ready]);

  const dayMap = useMemo(() => calendarDaysToMap(calendarDays), [calendarDays]);
  const weekJobs = useMemo(
    () =>
      jobsBetween(
        calendarDays,
        startOfWeek(new Date()),
        endOfWeek(new Date()),
      ),
    [calendarDays],
  );
  const urgentJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.dDay !== null && j.dDay >= 0 && j.dDay <= 7)
        .slice(0, 5),
    [jobs],
  );
  const calendarHref = `/calendar${queryString ? `?${queryString}` : ""}`;

  // weekJobs를 urgentJobs fallback으로 활용
  const sidebarUrgentJobs = urgentJobs.length > 0 ? urgentJobs : weekJobs.slice(0, 5);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      {/* 페이지 헤더 */}
      <div className="border-b border-[var(--app-line)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">채용공고</h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            수습 가능 여부, KICPA 조건, 마감일과 출처를 함께 확인하세요.
          </p>

          {/* 검색바 */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="회사명, 직무, 키워드로 검색"
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
              value={filters.sort}
              onChange={(e) =>
                setFilters({ ...filters, sort: e.target.value })
              }
              className="rounded-xl border border-[var(--app-line)] bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none"
            >
              {Object.entries(jobSortLabels).map(([v, l]) => (
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
                  onClick={() => setFilters(defaultJobFilters)}
                  variant="ghost"
                  size="sm"
                  iconStart={<RefreshCw size={12} />}
                >
                  필터 초기화
                </ActionButton>
              )}
            </div>

            {filterOpen && (
              <div className="overflow-x-auto border-t border-[var(--app-line)] px-5 py-4">
                <div className="flex gap-8">
                  <CheckboxColumn
                    title="직무군"
                    field="jobFamily"
                    options={JOB_FAMILY_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <CheckboxColumn
                    title="회사 유형"
                    field="companyType"
                    options={COMPANY_TYPE_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <CheckboxColumn
                    title="고용 형태"
                    field="employmentType"
                    options={EMPLOYMENT_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <CheckboxColumn
                    title="KICPA 조건"
                    field="kicpaCondition"
                    options={KICPA_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <CheckboxColumn
                    title="마감 유형"
                    field="deadlineType"
                    options={DEADLINE_TYPE_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <div className="min-w-[120px]">
                    <h3 className="mb-2 text-xs font-bold text-gray-800">
                      경력 연차
                    </h3>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-500">최소 (년)</label>
                      <input
                        type="number"
                        min={0}
                        value={filters.minExperienceYears}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minExperienceYears: e.target.value,
                          })
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                      <label className="text-xs text-gray-500">최대 (년)</label>
                      <input
                        type="number"
                        min={0}
                        value={filters.maxExperienceYears}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxExperienceYears: e.target.value,
                          })
                        }
                        placeholder="15+"
                        className="w-full rounded-lg border border-[var(--app-line)] px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  </div>
                  <CheckboxColumn
                    title="수습 CPA 가능"
                    field="traineeStatus"
                    options={TRAINEE_OPTS}
                    filters={filters}
                    onChange={setFilters}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* 공고 그리드 */}
          <div>
            {!loading && (
              <p className="mb-4 text-sm text-gray-500">
                검색 결과{" "}
                <span className="font-bold text-gray-900">
                  {total.toLocaleString("ko-KR")}
                </span>
                건
              </p>
            )}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error} API 서버가 실행 중인지 확인해 주세요.
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-2xl bg-gray-100"
                  />
                ))}
              </div>
            ) : jobs.length ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobGridCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--app-line)] bg-white p-10 text-center text-sm text-[var(--app-muted)]">
                검색 조건에 맞는 공고가 없습니다.
              </div>
            )}
          </div>

          {/* 우측 사이드바 — 새 캘린더 UI */}
          <aside className="h-fit">
            {calendarError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {calendarError}
              </div>
            )}
            {calendarLoading ? (
              <div className="flex flex-col gap-4">
                <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
              </div>
            ) : (
              <JobsSidebarCalendar
                monthDate={miniMonth}
                dayMap={dayMap}
                urgentJobs={sidebarUrgentJobs}
                calendarHref={calendarHref}
                onMonthChange={setMiniMonth}
              />
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
