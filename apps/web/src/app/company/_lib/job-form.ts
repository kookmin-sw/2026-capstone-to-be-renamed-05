import type {
  CompanyManagedJobItem,
  DeadlineType,
  EmploymentType,
  JobFamily,
  JobSubmissionItem,
  KicpaCondition,
  TraineeStatus,
} from "@cpa/shared";
import type { CompanyJobSubmissionPayload } from "@/lib/api";

export type JobForm = {
  title: string;
  description: string;
  originalUrl: string;
  jobFamily: string;
  employmentType: string;
  kicpaCondition: string;
  traineeStatus: string;
  practicalTrainingInstitution: string;
  minExperienceYears: string;
  maxExperienceYears: string;
  location: string;
  deadlineType: string;
  deadline: string;
};

export const emptyJobForm: JobForm = {
  title: "",
  description: "",
  originalUrl: "",
  jobFamily: "AUDIT",
  employmentType: "FULL_TIME",
  kicpaCondition: "UNCLEAR",
  traineeStatus: "UNCLEAR",
  practicalTrainingInstitution: "",
  minExperienceYears: "",
  maxExperienceYears: "",
  location: "",
  deadlineType: "FIXED_DATE",
  deadline: "",
};

export function toJobPayload(form: JobForm): CompanyJobSubmissionPayload {
  return {
    title: form.title,
    description: form.description,
    originalUrl: form.originalUrl,
    jobFamily: form.jobFamily as JobFamily,
    employmentType: form.employmentType as EmploymentType,
    kicpaCondition: form.kicpaCondition as KicpaCondition,
    traineeStatus: form.traineeStatus as TraineeStatus,
    practicalTrainingInstitution:
      form.practicalTrainingInstitution === ""
        ? undefined
        : form.practicalTrainingInstitution === "true",
    minExperienceYears: optionalNumber(form.minExperienceYears),
    maxExperienceYears: optionalNumber(form.maxExperienceYears),
    location: form.location,
    deadlineType: form.deadlineType as DeadlineType,
    deadline:
      form.deadlineType === "FIXED_DATE" && form.deadline
        ? kstEndOfDayIso(form.deadline)
        : undefined,
  };
}

export function toJobForm(job: CompanyManagedJobItem): JobForm {
  return {
    title: job.title,
    description: job.description,
    originalUrl: job.originalUrl,
    jobFamily: job.jobFamily,
    employmentType: job.employmentType,
    kicpaCondition: job.kicpaCondition,
    traineeStatus: job.traineeStatus,
    practicalTrainingInstitution:
      job.practicalTrainingInstitution === null
        ? ""
        : String(job.practicalTrainingInstitution),
    minExperienceYears: job.minExperienceYears?.toString() ?? "",
    maxExperienceYears: job.maxExperienceYears?.toString() ?? "",
    location: job.location ?? "",
    deadlineType: job.deadlineType,
    deadline: job.deadline ? job.deadline.slice(0, 10) : "",
  };
}

export function toSubmissionForm(submission: JobSubmissionItem): JobForm {
  return {
    title: submission.title,
    description: submission.description,
    originalUrl: submission.originalUrl ?? "",
    jobFamily: submission.jobFamily,
    employmentType: submission.employmentType,
    kicpaCondition: submission.kicpaCondition,
    traineeStatus: submission.traineeStatus,
    practicalTrainingInstitution:
      submission.practicalTrainingInstitution === null
        ? ""
        : String(submission.practicalTrainingInstitution),
    minExperienceYears: submission.minExperienceYears?.toString() ?? "",
    maxExperienceYears: submission.maxExperienceYears?.toString() ?? "",
    location: submission.location ?? "",
    deadlineType: submission.deadlineType,
    deadline: submission.deadline ? submission.deadline.slice(0, 10) : "",
  };
}

function optionalNumber(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function kstEndOfDayIso(date: string) {
  return new Date(`${date}T23:59:59.000+09:00`).toISOString();
}
