"use client";

import type {
  JobCalendarDay,
  JobCalendarEvent,
  JobCalendarRange,
} from "@cpa/shared";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullDeadlineCalendar } from "@/components/deadline-calendar";
import { SiteNav } from "@/components/site-nav";
import { ActionButton } from "@/components/ui/action-button";
import { useJobFilterState } from "@/hooks/use-job-filter-state";
import { fetchJobCalendar } from "@/lib/api";
import { calendarDaysToMap, calendarEventsToMap } from "@/lib/calendar-data";
import { getCalendarGridRange, toDateKey } from "@/lib/date-utils";
import {
  buildJobFilterParams,
  defaultJobFilters,
  type JobFilterState,
} from "@/lib/job-filters";
import styles from "./calendar-page.module.css";

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

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [calendarDays, setCalendarDays] = useState<JobCalendarDay[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<JobCalendarEvent[]>([]);
  const [calendarRanges, setCalendarRanges] = useState<JobCalendarRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { filters, setFilters, ready } = useJobFilterState();

  const calendarRange = useMemo(
    () => getCalendarGridRange(monthDate),
    [monthDate],
  );

  const calendarParams = useMemo(() => {
    const next = buildJobFilterParams(filters);
    next.set("from", toDateKey(calendarRange.from));
    next.set("to", toDateKey(calendarRange.to));
    return next;
  }, [calendarRange, filters]);

  useEffect(() => {
    if (!ready) return;
    let ignore = false;
    fetchJobCalendar(calendarParams)
      .then((data) => {
        if (!ignore) {
          setCalendarDays(data.days);
          setCalendarEvents(data.events ?? []);
          setCalendarRanges(data.ranges ?? []);
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
  }, [calendarParams, ready]);

  const dayMap = useMemo(() => calendarDaysToMap(calendarDays), [calendarDays]);
  const eventMap = useMemo(
    () => calendarEventsToMap(calendarEvents),
    [calendarEvents],
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      {/* 페이지 헤더 — 배경색 통일 */}
      <div className="border-b border-[var(--app-line)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">마감일 캘린더</h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            필터에 맞는 공고의 시작 일정과 마감 일정을 함께 확인하세요.
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
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} 캘린더 API 서버를 확인해 주세요.
          </div>
        )}
        {loading ? (
          <div className="h-[600px] animate-pulse rounded-2xl bg-gray-100" />
        ) : (
          <FullDeadlineCalendar
            monthDate={monthDate}
            dayMap={dayMap}
            eventMap={eventMap}
            ranges={calendarRanges}
            onMonthChange={setMonthDate}
          />
        )}
      </div>
    </main>
  );
}
