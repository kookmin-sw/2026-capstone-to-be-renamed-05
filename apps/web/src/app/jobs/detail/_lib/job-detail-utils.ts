import type { JobDetailItem } from "@cpa/shared";
import { deadlineTypeLabels } from "@/lib/labels";

export function formatDeadlineDisplay(job: JobDetailItem): string {
  if (!job.deadline) return deadlineTypeLabels[job.deadlineType];
  const date = new Date(job.deadline).toLocaleDateString("ko-KR");
  if (job.dDay === null) return date;
  if (job.dDay < 0) return `${date} · 마감`;
  if (job.dDay === 0) return `${date} · 오늘 마감`;
  return `${date} · D-${job.dDay}`;
}

export function formatTrainingInstitution(value: boolean | null): string {
  if (value === true) return "인정 가능";
  if (value === false) return "인정 불가";
  return "확인 필요";
}

export function formatExperience(
  min: number | null,
  max: number | null,
): string {
  if (min === null && max === null) return "불명확";
  if (min !== null && max !== null) return `${min}~${max}년`;
  if (min !== null) return `${min}년 이상`;
  return `${max}년 이하`;
}
