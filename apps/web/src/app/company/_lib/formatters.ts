import type { DeadlineType } from "@cpa/shared";
import { deadlineTypeLabels } from "@/lib/labels";

type ExperienceFields = {
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
};

type DeadlineFields = {
  deadlineType: DeadlineType;
  deadline: string | null;
};

export function statusLabel(status: string) {
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "반려";
  return "검수 대기";
}

export function experienceLabel(job: ExperienceFields) {
  if (job.minExperienceYears === null && job.maxExperienceYears === null) {
    return "무관";
  }
  if (job.minExperienceYears !== null && job.maxExperienceYears !== null) {
    return `${job.minExperienceYears}~${job.maxExperienceYears}년`;
  }
  if (job.minExperienceYears !== null) {
    return `${job.minExperienceYears}년 이상`;
  }
  return `${job.maxExperienceYears}년 이하`;
}

export function deadlineLabel(job: DeadlineFields) {
  if (!job.deadline) return deadlineTypeLabels[job.deadlineType];
  return new Date(job.deadline).toLocaleDateString("ko-KR");
}
