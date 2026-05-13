import {
  JOB_PRESET_IDS,
  type JobFilterPreference,
  type JobPresetId,
} from "@cpa/shared";

export type JobFilterState = {
  quick: string;
  preset: "" | JobPresetId;
  userPresetId: string;
  search: string;
  jobFamily: string;
  companyType: string;
  traineeStatus: string;
  selectedLocations: string[];
  employmentType: string;
  kicpaCondition: string;
  deadlineType: string;
  deadline: string;
  practicalTrainingInstitution: string;
  deadlineWithinDays: string;
  careerLevel: string;
  minExperienceYears: string;
  maxExperienceYears: string;
  minCompanyAgeYears: string;
  maxCompanyAgeYears: string;
  maxAttritionRate: string;
  salaryLevel: string;
  sort: string;
};

export const defaultJobFilters: JobFilterState = {
  quick: "",
  preset: "",
  userPresetId: "",
  search: "",
  jobFamily: "",
  companyType: "",
  traineeStatus: "",
  selectedLocations: [],
  employmentType: "",
  kicpaCondition: "",
  deadlineType: "",
  deadline: "",
  practicalTrainingInstitution: "",
  deadlineWithinDays: "",
  careerLevel: "",
  minExperienceYears: "",
  maxExperienceYears: "",
  minCompanyAgeYears: "",
  maxCompanyAgeYears: "",
  maxAttritionRate: "",
  salaryLevel: "",
  sort: "deadlineAsc",
};

export type QuickJobFilterId =
  | "trainee"
  | "entry"
  | "experienced"
  | "deadlineSoon";

export type QuickJobFilter = {
  id: QuickJobFilterId;
  label: string;
  values: Partial<JobFilterState>;
  aliases: Record<string, string>;
};

export const quickJobFilters: QuickJobFilter[] = [
  {
    id: "trainee",
    label: "실무수습 가능",
    values: { traineeStatus: "AVAILABLE" },
    aliases: { traineeAvailable: "possible" },
  },
  {
    id: "entry",
    label: "신입 가능",
    values: { careerLevel: "entry" },
    aliases: { careerLevel: "entry" },
  },
  {
    id: "experienced",
    label: "경력 이직",
    values: { careerLevel: "junior,experienced" },
    aliases: { careerLevel: "junior,experienced" },
  },
  {
    id: "deadlineSoon",
    label: "마감 임박",
    values: {
      deadline: "soon",
      deadlineType: "FIXED_DATE",
      deadlineWithinDays: "7",
      sort: "deadlineAsc",
    },
    aliases: { deadline: "soon" },
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
  "careerLevel",
  "minExperienceYears",
  "maxExperienceYears",
  "minCompanyAgeYears",
  "maxCompanyAgeYears",
  "maxAttritionRate",
  "salaryLevel",
  "sort",
] as const;

export const jobFilterQueryKeys = new Set<string>([
  ...stringParamKeys,
  "quick",
  "preset",
  "userPresetId",
  "traineeAvailable",
  "deadline",
  "locations",
  "location",
]);

export function buildJobFilterParams(filters: JobFilterState) {
  const next = new URLSearchParams();
  for (const key of stringParamKeys) {
    const value = filters[key];
    if (value) next.set(key, value);
  }
  if (filters.preset) next.set("preset", filters.preset);
  if (!next.has("sort")) next.set("sort", defaultJobFilters.sort);
  filters.selectedLocations.forEach((location) => {
    next.append("locations", location);
  });
  return next;
}

export function jobFiltersToQueryString(filters: JobFilterState) {
  return buildJobUrlParams(filters).toString();
}

export function parseJobFiltersFromParams(params: URLSearchParams) {
  const quick = params.get("quick");
  const quickFilter = quickJobFilters.find((item) => item.id === quick);
  const filters: JobFilterState = quickFilter
    ? quickFilterState(quickFilter)
    : { ...defaultJobFilters };
  let hasAnyQuery = Boolean(quickFilter);
  const preset = normalizePresetParam(params.get("preset"));
  const userPresetId = params.get("userPresetId")?.trim() ?? "";

  if (preset) {
    filters.preset = preset;
    filters.userPresetId = "";
    hasAnyQuery = true;
  }

  if (userPresetId) {
    filters.userPresetId = userPresetId.slice(0, 80);
    filters.preset = "";
    hasAnyQuery = true;
  }

  if (!quickFilter) {
    for (const key of stringParamKeys) {
      const value = params.get(key);
      if (value !== null) {
        filters[key] = value;
        hasAnyQuery = true;
      }
    }
  }

  if (params.get("traineeAvailable") === "possible") {
    filters.traineeStatus = "AVAILABLE";
    hasAnyQuery = true;
  }

  const careerLevel = normalizeCommaParam(params.get("careerLevel"));
  if (careerLevel) {
    filters.careerLevel = careerLevel;
    hasAnyQuery = true;
  }

  if (params.get("deadline") === "soon") {
    filters.deadline = "soon";
    filters.deadlineType = "FIXED_DATE";
    filters.deadlineWithinDays = filters.deadlineWithinDays || "7";
    filters.sort = "deadlineAsc";
    hasAnyQuery = true;
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

export function jobFiltersToPresetSnapshot(filters: JobFilterState) {
  const preference = jobFiltersToPreference(filters);
  if (preference.sort === defaultJobFilters.sort) {
    delete preference.sort;
  }
  return orderJobFilterPreference(preference);
}

export function jobPresetSignatureFromFilters(filters: JobFilterState) {
  return JSON.stringify(jobFiltersToPresetSnapshot(filters));
}

export function isMeaningfulJobPresetSnapshot(filters: JobFilterState) {
  const snapshot = jobFiltersToPresetSnapshot(filters);
  if (snapshot.selectedLocations?.length) return true;
  return stringParamKeys.some(
    (key) => key !== "sort" && Boolean(snapshot[key]),
  );
}

export function userPresetState(
  preference: JobFilterPreference,
  userPresetId: string,
): JobFilterState {
  return {
    ...normalizeJobFilterPreference(preference),
    quick: "",
    preset: "",
    userPresetId,
  };
}

export function quickFilterState(filter: QuickJobFilter) {
  return {
    ...defaultJobFilters,
    ...filter.values,
    quick: filter.id,
    selectedLocations: filter.values.selectedLocations ?? [],
    sort: filter.values.sort ?? defaultJobFilters.sort,
  };
}

export function buildJobUrlParams(filters: JobFilterState) {
  const quickFilter = quickJobFilters.find((item) => item.id === filters.quick);
  if (quickFilter) {
    const next = new URLSearchParams({ quick: quickFilter.id });
    for (const [key, value] of Object.entries(quickFilter.aliases)) {
      next.set(key, value);
    }
    if (filters.sort) next.set("sort", filters.sort);
    appendPresetUrlParams(next, filters);
    return next;
  }

  const next = buildJobFilterParams(filters);
  if (filters.deadline) next.set("deadline", filters.deadline);
  appendPresetUrlParams(next, filters);
  return next;
}

function orderJobFilterPreference(preference: JobFilterPreference) {
  const ordered: JobFilterPreference = {};
  for (const key of stringParamKeys) {
    const value = preference[key];
    if (typeof value === "string" && value) {
      ordered[key] = value;
    }
  }
  if (preference.selectedLocations?.length) {
    ordered.selectedLocations = [...preference.selectedLocations];
  }
  return ordered;
}

function appendPresetUrlParams(
  params: URLSearchParams,
  filters: JobFilterState,
) {
  if (filters.preset) params.set("preset", filters.preset);
  if (filters.userPresetId) params.set("userPresetId", filters.userPresetId);
}

function normalizePresetParam(value: string | null): JobPresetId | "" {
  if (!value) return "";
  return (JOB_PRESET_IDS as readonly string[]).includes(value)
    ? (value as JobPresetId)
    : "";
}

function normalizeCommaParam(value: string | null) {
  if (!value) return "";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .join(",");
}
