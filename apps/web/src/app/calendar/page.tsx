"use client";

import type {
  JobCalendarDay,
  JobCalendarEvent,
  JobCalendarRange,
} from "@cpa/shared";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  FullDeadlineCalendar,
  ScrollableDeadlineCalendar,
} from "@/components/deadline-calendar";
import { JobSearchFilters } from "@/components/job-search-filters";
import { SiteNav } from "@/components/site-nav";
import { useJobFilterState } from "@/hooks/use-job-filter-state";
import { fetchJobCalendar } from "@/lib/api";
import { calendarDaysToMap, calendarEventsToMap } from "@/lib/calendar-data";
import {
  getCalendarGridRange,
  getMonthRange,
  toDateKey,
} from "@/lib/date-utils";
import { buildJobFilterParams } from "@/lib/job-filters";
import styles from "./calendar-page.module.css";

type CalendarViewMode = "month" | "timeline";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [calendarDays, setCalendarDays] = useState<JobCalendarDay[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<JobCalendarEvent[]>([]);
  const [calendarRanges, setCalendarRanges] = useState<JobCalendarRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { filters, setFilters, ready } = useJobFilterState();

  const calendarRange = useMemo(
    () =>
      viewMode === "month"
        ? getCalendarGridRange(visibleDate)
        : getMonthRange(visibleDate),
    [viewMode, visibleDate],
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

      {/* 페이지 히어로 */}
      <div
        className={styles.pageHero}
        style={{ '--hero-img': 'url(/hero/calendar-hero.png)' } as CSSProperties}
      >
        <div className={styles.pageHeroInner}>
          <h1 className={styles.pageHeroTitle}>마감일 캘린더</h1>
          <p className={styles.pageHeroDesc}>
            필터에 맞는 공고의 시작 일정과 마감 일정을 함께 확인하세요.
          </p>

          <JobSearchFilters filters={filters} onChange={setFilters} />
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
          <div className={styles.calendarShell}>
            <div className={styles.viewToolbar}>
              <div
                className={styles.viewSwitch}
                role="tablist"
                aria-label="캘린더 보기"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "month"}
                  className={
                    viewMode === "month"
                      ? styles.viewSwitchButtonActive
                      : styles.viewSwitchButton
                  }
                  onClick={() => setViewMode("month")}
                >
                  월간
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "timeline"}
                  className={
                    viewMode === "timeline"
                      ? styles.viewSwitchButtonActive
                      : styles.viewSwitchButton
                  }
                  onClick={() => setViewMode("timeline")}
                >
                  주간
                </button>
              </div>
            </div>

            {viewMode === "month" ? (
              <FullDeadlineCalendar
                monthDate={visibleDate}
                dayMap={dayMap}
                eventMap={eventMap}
                ranges={calendarRanges}
                onMonthChange={setVisibleDate}
              />
            ) : (
              <ScrollableDeadlineCalendar
                monthDate={visibleDate}
                dayMap={dayMap}
                eventMap={eventMap}
                ranges={calendarRanges}
                onMonthChange={setVisibleDate}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
