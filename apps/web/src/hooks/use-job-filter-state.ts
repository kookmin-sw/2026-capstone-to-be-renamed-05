"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJobFilterPreference, saveJobFilterPreference } from "@/lib/api";
import {
  defaultJobFilters,
  jobFiltersToPreference,
  jobFiltersToQueryString,
  normalizeJobFilterPreference,
  parseJobFiltersFromParams,
  type JobFilterState,
} from "@/lib/job-filters";

export type SetJobFiltersOptions = {
  preserveUserPreset?: boolean;
};

export function useJobFilterState() {
  const [filters, setFilters] = useState<JobFilterState>(defaultJobFilters);
  const [ready, setReady] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const lastSaved = useRef("");

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

      fetchJobFilterPreference()
        .then((data) => {
          if (ignore) return;
          setCanPersist(data.authenticated);
          const restored = normalizeJobFilterPreference(data.filter);
          setFilters(restored);
          setReady(true);
        })
        .catch(() => {
          if (ignore) return;
          setCanPersist(false);
          setReady(true);
        });
    });

    const syncFromHistory = () => {
      const urlFilters = readCurrentUrlFilters();
      if (!urlFilters.hasAnyQuery) return;
      setFilters(urlFilters.filters);
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

  useEffect(() => {
    if (!ready || !canPersist) return;
    const payload = JSON.stringify(jobFiltersToPreference(filters));
    if (payload === lastSaved.current) return;
    const timer = window.setTimeout(() => {
      saveJobFilterPreference(jobFiltersToPreference(filters))
        .then(() => {
          lastSaved.current = payload;
        })
        .catch(() => {
          setCanPersist(false);
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [canPersist, filters, ready]);

  const updateFilters = useCallback(
    (next: JobFilterState, options: SetJobFiltersOptions = {}) => {
      setFilters({
        ...next,
        quick: "",
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
    canPersist,
  };
}

function readCurrentUrlFilters() {
  if (typeof window === "undefined") {
    return { filters: defaultJobFilters, hasAnyQuery: false };
  }
  return parseJobFiltersFromParams(new URLSearchParams(window.location.search));
}
