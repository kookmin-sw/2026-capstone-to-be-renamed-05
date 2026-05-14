"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultJobFilters,
  jobFiltersToQueryString,
  parseJobFiltersFromParams,
  type JobFilterState,
} from "@/lib/job-filters";

export type SetJobFiltersOptions = {
  preserveUserPreset?: boolean;
  preserveQuick?: boolean;
};

export function useJobFilterState() {
  const [filters, setFilters] = useState<JobFilterState>(defaultJobFilters);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      const urlFilters = readCurrentUrlFilters();
      if (urlFilters.hasAnyQuery) {
        if (ignore) return;
        setFilters(urlFilters.filters);
        setReady(true);
        return;
      }

      if (ignore) return;
      setFilters(defaultJobFilters);
      setReady(true);
    });

    const syncFromHistory = () => {
      const urlFilters = readCurrentUrlFilters();
      setFilters(urlFilters.hasAnyQuery ? urlFilters.filters : defaultJobFilters);
      setReady(true);
    };
    window.addEventListener("popstate", syncFromHistory);

    return () => {
      ignore = true;
      window.removeEventListener("popstate", syncFromHistory);
    };
  }, []);

  const queryString = useMemo(
    () => jobFiltersToQueryString(filters),
    [filters],
  );

  useEffect(() => {
    if (!ready) return;
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [queryString, ready]);

  const updateFilters = useCallback(
    (next: JobFilterState, options: SetJobFiltersOptions = {}) => {
      setFilters({
        ...next,
        quick: options.preserveQuick ? next.quick : "",
        userPresetId: options.preserveUserPreset ? next.userPresetId : "",
      });
    },
    [],
  );

  return {
    filters,
    setFilters: updateFilters,
    ready,
    queryString,
    canPersist: false,
  };
}

function readCurrentUrlFilters() {
  if (typeof window === "undefined") {
    return { filters: defaultJobFilters, hasAnyQuery: false };
  }
  return parseJobFiltersFromParams(new URLSearchParams(window.location.search));
}
