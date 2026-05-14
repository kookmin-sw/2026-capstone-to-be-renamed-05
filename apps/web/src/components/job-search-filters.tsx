"use client";

import { jobPresetConfigs } from "@cpa/shared";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Clock3,
  Coins,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { SetJobFiltersOptions } from "@/hooks/use-job-filter-state";
import {
  defaultJobFilters,
  quickFilterState,
  quickJobFilters,
  type JobFilterState,
  type QuickJobFilter,
  type QuickJobFilterId,
} from "@/lib/job-filters";
import { cn } from "@/lib/utils";
import { JobPresetBar } from "./job-preset-bar";
import { RegionFilterDialog } from "./region-filter-dialog";
import { ActionButton } from "./ui/action-button";
import { FilterInput } from "./ui/filter-select";
import styles from "./job-search-filters.module.css";

type JobFiltersChange = (
  filters: JobFilterState,
  options?: SetJobFiltersOptions,
) => void;

type JobSearchFiltersProps = {
  filters: JobFilterState;
  onChange: JobFiltersChange;
  className?: string;
};

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

const SALARY_LEVEL_OPTS = [
  { value: "ABOVE_AVERAGE", label: "업계평균이상" },
  { value: "TOP_1", label: "상위1%" },
  { value: "TOP_2_5", label: "상위2~5%" },
  { value: "TOP_6_10", label: "상위6~10%" },
  { value: "TOP_11_20", label: "상위11~20%" },
];

const QUICK_FILTER_ICONS: Record<QuickJobFilterId, LucideIcon> = {
  trainee: GraduationCap,
  entry: UserRoundCheck,
  experienced: BriefcaseBusiness,
  deadlineSoon: Clock3,
  salaryAbove: Coins,
  big4: Building2,
  seoul: MapPin,
};

const BASE_PRESET_ICONS: Record<string, LucideIcon> = {
  "active-hiring": Clock3,
  "career-verified": BadgeCheck,
};

const ADVANCED_FILTER_KEYS: Array<keyof JobFilterState> = [
  "jobFamily",
  "companyType",
  "salaryLevel",
  "employmentType",
  "kicpaCondition",
  "deadlineType",
  "deadlineWithinDays",
];

export function JobSearchFilters({
  filters,
  onChange,
  className,
}: JobSearchFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const advancedFilterCount = getAdvancedFilterCount(filters);

  return (
    <div className={cn(styles.root, className)}>
      <section className={styles.searchFilterSection}>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <Search
              size={16}
              className={styles.searchInputIcon}
              aria-hidden="true"
            />
            <input
              value={filters.search}
              onChange={(event) =>
                onChange({ ...filters, search: event.target.value })
              }
              placeholder="회사명, 직무, 키워드로 검색"
              className={styles.searchInput}
            />
          </div>
          <ActionButton type="button" iconStart={<Search size={15} />}>
            검색
          </ActionButton>
        </div>

        <div className={styles.advancedFilterCard}>
          <div className={styles.advancedFilterHeader}>
            <div className={styles.filterHeaderLeft}>
              <ActionButton
                type="button"
                onClick={() => setFilterOpen((prev) => !prev)}
                variant="ghost"
                size="sm"
                className={styles.filterHeaderButton}
                iconStart={<SlidersHorizontal size={15} />}
                iconEnd={
                  <ChevronDown
                    size={15}
                    className={cn(
                      styles.filterChevron,
                      filterOpen && styles.filterChevronOpen,
                    )}
                  />
                }
              >
                고급 필터
                <span className={styles.filterHeaderMeta}>
                  {advancedFilterCount
                    ? `${advancedFilterCount}개 적용`
                    : "상세 조건"}
                </span>
              </ActionButton>
              {filterOpen && (
                <ActionButton
                  type="button"
                  onClick={() => onChange(defaultJobFilters)}
                  variant="ghost"
                  size="sm"
                  iconStart={<RefreshCw size={12} />}
                >
                  초기화
                </ActionButton>
              )}
            </div>
            <div className={styles.advancedHeaderQuickFilters}>
              <JobQuickFilterBar filters={filters} onChange={onChange} />
            </div>
          </div>

          {filterOpen && (
            <div className={styles.advancedFilterBody}>
              <div className={styles.personalPresetColumn}>
                <h3 className={styles.personalPresetTitle}>맞춤 프리셋</h3>
                <div className={styles.personalPresetScroll}>
                  <JobPresetBar
                    filters={filters}
                    onChange={onChange}
                    showBasePresets={false}
                    wrap
                    compact
                    className={styles.personalPresetBar}
                  />
                </div>
              </div>
              <div className={styles.advancedFilterScroller}>
                <div className={styles.advancedFilterGrid}>
                  <CheckboxColumn
                    title="직무군"
                    field="jobFamily"
                    options={JOB_FAMILY_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <CheckboxColumn
                    title="회사 유형"
                    field="companyType"
                    options={COMPANY_TYPE_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <CheckboxColumn
                    title="연봉 수준"
                    field="salaryLevel"
                    options={SALARY_LEVEL_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <RegionFilterColumn filters={filters} onChange={onChange} />
                  <CheckboxColumn
                    title="고용 형태"
                    field="employmentType"
                    options={EMPLOYMENT_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <CheckboxColumn
                    title="KICPA 조건"
                    field="kicpaCondition"
                    options={KICPA_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <CheckboxColumn
                    title="마감 유형"
                    field="deadlineType"
                    options={DEADLINE_TYPE_OPTS}
                    filters={filters}
                    onChange={onChange}
                  />
                  <FilterInput
                    label="마감 기간"
                    type="number"
                    min={1}
                    value={filters.deadlineWithinDays}
                    placeholder="N일 이내"
                    onChange={(deadlineWithinDays) =>
                      onChange({ ...filters, deadlineWithinDays })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function JobQuickFilterBar({
  filters,
  onChange,
}: {
  filters: JobFilterState;
  onChange: JobFiltersChange;
}) {
  const applyQuickFilter = (filter: QuickJobFilter) => {
    if (filters.quick === filter.id) {
      onChange({ ...defaultJobFilters, search: filters.search });
      return;
    }

    onChange(
      {
        ...quickFilterState(filter),
        search: filters.search,
      },
      { preserveQuick: true },
    );
  };

  const applyBasePreset = (id: Exclude<JobFilterState["preset"], "">) => {
    onChange({
      ...filters,
      quick: "",
      preset: filters.preset === id ? "" : id,
      userPresetId: "",
    });
  };

  return (
    <div className={styles.quickFilterBar} aria-label="빠른 필터">
      {quickJobFilters.map((filter) => {
        const Icon = QUICK_FILTER_ICONS[filter.id];
        const selected = filters.quick === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={selected}
            onClick={() => applyQuickFilter(filter)}
            className={cn(
              styles.quickFilterButton,
              selected && styles.quickFilterButtonActive,
            )}
          >
            <Icon size={14} />
            {filter.label}
          </button>
        );
      })}
      {jobPresetConfigs.map((preset) => {
        const Icon = BASE_PRESET_ICONS[preset.id] ?? BadgeCheck;
        const selected = filters.preset === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => applyBasePreset(preset.id)}
            className={cn(
              styles.quickFilterButton,
              styles.presetQuickButton,
              selected && styles.quickFilterButtonActive,
            )}
          >
            <Icon size={14} />
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

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
  onChange: JobFiltersChange;
}) {
  const selected = splitMultiValue(filters[field] as string);
  const update = (next: string[]) => {
    const unique = next.filter(
      (value, index, all) => all.indexOf(value) === index,
    );
    onChange({
      ...filters,
      [field]: unique.length === options.length ? "" : unique.join(","),
    });
  };

  return (
    <div className="min-w-[130px]">
      <h3 className="mb-2 text-xs font-bold text-gray-800">{title}</h3>
      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={selected.length === 0}
            onChange={() => update([])}
            className="h-3.5 w-3.5 cursor-pointer accent-[#E8457A]"
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
              checked={selected.includes(opt.value)}
              onChange={() =>
                update(
                  selected.includes(opt.value)
                    ? selected.filter((value) => value !== opt.value)
                    : [...selected, opt.value],
                )
              }
              className="h-3.5 w-3.5 cursor-pointer accent-[#E8457A]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function RegionFilterColumn({
  filters,
  onChange,
}: {
  filters: JobFilterState;
  onChange: JobFiltersChange;
}) {
  return (
    <RegionFilterDialog
      className="min-w-[170px]"
      variant="compact"
      selectedLocations={filters.selectedLocations}
      onChange={(selectedLocations) =>
        onChange({ ...filters, selectedLocations })
      }
    />
  );
}

function splitMultiValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdvancedFilterCount(filters: JobFilterState) {
  return (
    ADVANCED_FILTER_KEYS.reduce(
      (count, key) => count + (filters[key] ? 1 : 0),
      0,
    ) + (filters.selectedLocations.length ? 1 : 0)
  );
}
