"use client";

import type { JobFilterState } from "@/lib/job-filters";
import {
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { RegionFilterDialog } from "./region-filter-dialog";

export const practicalTrainingLabels = {
  true: "인정 가능",
  false: "인정 불가",
};

export const jobSortLabels = {
  deadlineAsc: "마감 임박순",
  latest: "최신순",
  experienceAsc: "경력 낮은순",
  companyType: "회사 유형별",
  expired: "마감된 공고",
};

export function JobFilterPanel({
  filters,
  onChange,
}: {
  filters: JobFilterState;
  onChange: (filters: JobFilterState) => void;
}) {
  const update = <Key extends keyof JobFilterState>(
    key: Key,
    value: JobFilterState[Key],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-4">
      <label className="block text-sm font-medium text-[var(--app-muted)]">
        검색
        <input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="회사명, 직무, 키워드"
          className="mt-2 w-full border border-[var(--app-line)] bg-white px-3 py-2 text-[var(--foreground)] outline-none"
        />
      </label>

      <FilterGroup title="기본 필터">
        <SelectField
          label="직무군"
          value={filters.jobFamily}
          onChange={(value) => update("jobFamily", value)}
          options={jobFamilyLabels}
        />
        <SelectField
          label="회사 유형"
          value={filters.companyType}
          onChange={(value) => update("companyType", value)}
          options={companyTypeLabels}
        />
        <RegionFilterDialog
          selectedLocations={filters.selectedLocations}
          onChange={(locations) => update("selectedLocations", locations)}
        />
      </FilterGroup>

      <FilterGroup title="상세 필터">
        <SelectField
          label="수습 여부"
          value={filters.traineeStatus}
          onChange={(value) => update("traineeStatus", value)}
          options={traineeLabels}
        />
        <SelectField
          label="실무수습기관"
          value={filters.practicalTrainingInstitution}
          onChange={(value) => update("practicalTrainingInstitution", value)}
          options={practicalTrainingLabels}
        />
        <SelectField
          label="고용형태"
          value={filters.employmentType}
          onChange={(value) => update("employmentType", value)}
          options={employmentLabels}
        />
        <SelectField
          label="KICPA 조건"
          value={filters.kicpaCondition}
          onChange={(value) => update("kicpaCondition", value)}
          options={kicpaLabels}
        />
        <SelectField
          label="마감 유형"
          value={filters.deadlineType}
          onChange={(value) => update("deadlineType", value)}
          options={deadlineTypeLabels}
        />
        <InputField
          label="마감 N일 이내"
          value={filters.deadlineWithinDays}
          onChange={(value) => update("deadlineWithinDays", value)}
          placeholder="7"
          type="number"
        />
        <RangeFields
          label="경력"
          minValue={filters.minExperienceYears}
          maxValue={filters.maxExperienceYears}
          onMinChange={(value) => update("minExperienceYears", value)}
          onMaxChange={(value) => update("maxExperienceYears", value)}
          unit="년"
        />
        <RangeFields
          label="업력"
          minValue={filters.minCompanyAgeYears}
          maxValue={filters.maxCompanyAgeYears}
          onMinChange={(value) => update("minCompanyAgeYears", value)}
          onMaxChange={(value) => update("maxCompanyAgeYears", value)}
          unit="년"
        />
        <InputField
          label="퇴사율 이하"
          value={filters.maxAttritionRate}
          onChange={(value) => update("maxAttritionRate", value)}
          placeholder="10"
          type="number"
        />
      </FilterGroup>

      <SelectField
        label="정렬"
        value={filters.sort}
        onChange={(value) => update("sort", value)}
        options={jobSortLabels}
        allowEmpty={false}
      />
    </div>
  );
}

export function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--app-line)] pt-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  allowEmpty?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-[var(--app-muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-[var(--app-line)] bg-white px-3 py-2 text-[var(--foreground)]"
      >
        {allowEmpty && <option value="">전체</option>}
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="text-sm font-medium text-[var(--app-muted)]">
      {label}
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-[var(--app-line)] bg-white px-3 py-2 text-[var(--foreground)] outline-none"
      />
    </label>
  );
}

export function RangeFields({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  unit,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  unit: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--app-muted)]">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder={`최소 ${unit}`}
          className="w-full border border-[var(--app-line)] bg-white px-3 py-2 text-[var(--foreground)] outline-none"
        />
        <input
          type="number"
          min={0}
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder={`최대 ${unit}`}
          className="w-full border border-[var(--app-line)] bg-white px-3 py-2 text-[var(--foreground)] outline-none"
        />
      </div>
    </div>
  );
}
