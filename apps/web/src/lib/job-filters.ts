import type { JobFilterPreference } from "@cpa/shared";

export type JobFilterState = {
  search: string;
  jobFamily: string;
  companyType: string;
  traineeStatus: string;
  selectedLocations: string[];
  employmentType: string;
  kicpaCondition: string;
  deadlineType: string;
  practicalTrainingInstitution: string;
  deadlineWithinDays: string;
  minExperienceYears: string;
  maxExperienceYears: string;
  minCompanyAgeYears: string;
  maxCompanyAgeYears: string;
  maxAttritionRate: string;
  sort: string;
};

export const defaultJobFilters: JobFilterState = {
  search: "",
  jobFamily: "",
  companyType: "",
  traineeStatus: "",
  selectedLocations: [],
  employmentType: "",
  kicpaCondition: "",
  deadlineType: "",
  practicalTrainingInstitution: "",
  deadlineWithinDays: "",
  minExperienceYears: "",
  maxExperienceYears: "",
  minCompanyAgeYears: "",
  maxCompanyAgeYears: "",
  maxAttritionRate: "",
  sort: "deadlineAsc",
};

export type QuickJobFilterId = "trainee" | "entry" | "career" | "urgent";

export const quickJobFilters: {
  id: QuickJobFilterId;
  label: string;
  values: Partial<JobFilterState>;
}[] = [
  {
    id: "trainee",
    label: "실무수습 가능",
    values: { traineeStatus: "AVAILABLE" },
  },
  { id: "entry", label: "신입·인턴", values: { maxExperienceYears: "0" } },
  {
    id: "career",
    label: "경력 이직",
    values: { minExperienceYears: "1" },
  },
  {
    id: "urgent",
    label: "마감 임박",
    values: {
      deadlineType: "FIXED_DATE",
      deadlineWithinDays: "7",
      sort: "deadlineAsc",
    },
  },
];

const stringParamKeys = [
  "search",
  "jobFamily",
  "companyType",
  "traineeStatus",
  "employmentType",
  "kicpaCondition",
  "deadlineType",
  "practicalTrainingInstitution",
  "deadlineWithinDays",
  "minExperienceYears",
  "maxExperienceYears",
  "minCompanyAgeYears",
  "maxCompanyAgeYears",
  "maxAttritionRate",
  "sort",
] as const;

export const jobFilterQueryKeys = new Set<string>([
  ...stringParamKeys,
  "locations",
  "location",
]);

export function buildJobFilterParams(filters: JobFilterState) {
  const next = new URLSearchParams();
  for (const key of stringParamKeys) {
    const value = filters[key];
    if (value) next.set(key, value);
  }
  if (!next.has("sort")) next.set("sort", defaultJobFilters.sort);
  filters.selectedLocations.forEach((location) => {
    next.append("locations", location);
  });
  return next;
}

export function jobFiltersToQueryString(filters: JobFilterState) {
  return buildJobFilterParams(filters).toString();
}

export function parseJobFiltersFromParams(params: URLSearchParams) {
  const filters: JobFilterState = { ...defaultJobFilters };
  let hasAnyQuery = false;

  for (const key of stringParamKeys) {
    const value = params.get(key);
    if (value !== null) {
      filters[key] = value;
      hasAnyQuery = true;
    }
  }

  const locations = [
    ...params.getAll("locations"),
    ...params.getAll("location"),
  ]
    .map((location) => location.trim())
    .filter(Boolean)
    .filter((location, index, all) => all.indexOf(location) === index);
  if (locations.length) {
    filters.selectedLocations = locations;
    hasAnyQuery = true;
  }

  return { filters, hasAnyQuery };
}

export function normalizeJobFilterPreference(
  preference: JobFilterPreference | null | undefined,
) {
  const filters: JobFilterState = { ...defaultJobFilters };
  if (!preference) return filters;

  for (const key of stringParamKeys) {
    const value = preference[key];
    if (typeof value === "string") filters[key] = value;
  }
  if (Array.isArray(preference.selectedLocations)) {
    filters.selectedLocations = preference.selectedLocations.filter(
      (location): location is string => typeof location === "string",
    );
  }
  return filters;
}

export function jobFiltersToPreference(filters: JobFilterState) {
  const preference: JobFilterPreference = {};
  for (const key of stringParamKeys) {
    const value = filters[key];
    if (value) preference[key] = value;
  }
  if (filters.selectedLocations.length) {
    preference.selectedLocations = [...filters.selectedLocations];
  }
  if (!preference.sort) preference.sort = defaultJobFilters.sort;
  return preference;
}

export function quickFilterState(values: Partial<JobFilterState>) {
  return {
    ...defaultJobFilters,
    ...values,
    selectedLocations: values.selectedLocations ?? [],
    sort: values.sort ?? defaultJobFilters.sort,
  };
}
