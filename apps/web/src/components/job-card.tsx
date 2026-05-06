import type { JobListItem } from "@cpa/shared";
import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  ExternalLink,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  ActionLink,
  actionButtonClassName,
} from "@/components/ui/action-button";
import styles from "./job-card.module.css";

export function JobCard({ job }: { job: JobListItem }) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className="min-w-0 flex-1">
          <div className={styles.badgeRow}>
            <Badge tone="pink">{deadlineText(job)}</Badge>
            <Badge>{companyTypeLabels[job.companyType]}</Badge>
            <Badge>{jobFamilyLabels[job.jobFamily]}</Badge>
          </div>
          <h3 className={styles.title}>{job.title}</h3>
          <p className={styles.subtleLine}>
            <BriefcaseBusiness size={14} />
            {job.companyName} · {employmentLabels[job.employmentType]}
          </p>
        </div>
        <div className={styles.actions}>
          <ActionLink
            href={`/jobs/${job.id}`}
            size="sm"
          >
            상세 보기
          </ActionLink>
          <a
            href={job.originalUrl}
            target="_blank"
            rel="noreferrer"
            className={actionButtonClassName({ variant: "outline", size: "sm" })}
          >
            원문
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <Info label="KICPA 조건" value={kicpaLabels[job.kicpaCondition]} />
        <Info label="수습 CPA" value={traineeLabels[job.traineeStatus]} />
        <Info
          label="실무수습기관"
          value={trainingInstitutionText(job.practicalTrainingInstitution)}
        />
        <Info label="요구 경력" value={experienceText(job)} />
        <Info label="지역" value={job.location ?? "불명확"} />
        <Info
          label="마감일"
          value={
            job.deadline
              ? new Date(job.deadline).toLocaleDateString("ko-KR")
              : deadlineTypeLabels[job.deadlineType]
          }
        />
      </div>

      <div className={styles.footer}>
        <CalendarDays size={13} />
        출처: {job.sourceName}
        <span>·</span>
        최종 확인: {new Date(job.lastCheckedAt).toLocaleString("ko-KR")}
        <span className={styles.labelList}>
          {job.labels.map((label) => (
          <span
            key={label}
            className={styles.tag}
          >
            #{label}
          </span>
          ))}
        </span>
      </div>
    </article>
  );
}

export function JobGridCard({ job }: { job: JobListItem }) {
  const initial = job.companyName.charAt(0);
  const dDay = job.dDay;
  const dDayLabel =
    dDay === null
      ? null
      : dDay < 0
        ? "마감"
        : dDay === 0
          ? "D-Day"
          : `D-${dDay}`;
  const isUrgent = dDay !== null && dDay >= 0 && dDay <= 7;

  return (
    <article className={styles.gridCard}>
      <div className={styles.banner}>
        {dDayLabel && (
          <span
            className={cn(styles.dDay, isUrgent && styles.urgent)}
          >
            {dDayLabel}
          </span>
        )}
        <div className={styles.logo}>
          {job.companyLogoUrl ? (
            <img
              src={job.companyLogoUrl}
              alt={job.companyName}
            />
          ) : (
            initial
          )}
        </div>
        <div className={styles.companySummary}>
          <p className={styles.companyName}>{job.companyName}</p>
          <p className={styles.companyType}>{companyTypeLabels[job.companyType]}</p>
        </div>
      </div>

      <div className={styles.gridBody}>
        <div className={styles.badgeRow}>
          <Badge tone="pink">{jobFamilyLabels[job.jobFamily]}</Badge>
          <Badge>{employmentLabels[job.employmentType]}</Badge>
        </div>
        <h3 className={styles.gridTitle}>{job.title}</h3>
        <div className={styles.factGrid}>
          <Fact icon={MapPin} text={job.location ?? "지역 불명확"} />
          <Fact icon={GraduationCap} text={kicpaLabels[job.kicpaCondition]} />
          <Fact icon={UserRound} text={traineeLabels[job.traineeStatus]} />
          <Fact icon={CalendarRange} text={experienceText(job)} />
        </div>
        <div className={styles.gridActions}>
          <ActionLink
            href={`/jobs/${job.id}`}
            size="sm"
            className={styles.fillAction}
          >
            상세 보기
          </ActionLink>
          <a
            href={job.originalUrl}
            target="_blank"
            rel="noreferrer"
            className={actionButtonClassName({ variant: "outline", size: "icon" })}
            aria-label={`${job.title} 원문 보기`}
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function CompactJobRow({ job }: { job: JobListItem }) {
  return (
    <div className={styles.compactRow}>
      <div>
        <div className={styles.badgeRow}>
          <Badge tone="pink">{deadlineText(job)}</Badge>
          <Badge>{jobFamilyLabels[job.jobFamily]}</Badge>
          <Badge>{employmentLabels[job.employmentType]}</Badge>
        </div>
        <p className={styles.title}>{job.title}</p>
        <p className={styles.subtleLine}>
          {job.companyName} · {job.location ?? "지역 불명확"}
        </p>
      </div>
      <ActionLink href={`/jobs/${job.id}`} size="sm">
        상세 보기
      </ActionLink>
    </div>
  );
}

export function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "pink";
}) {
  return (
    <span
      className={cn(styles.badge, tone === "pink" && styles.badgeBrand)}
    >
      {children}
    </span>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.info}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}

function Fact({
  icon: Icon,
  text,
}: {
  icon: typeof MapPin;
  text: string;
}) {
  return (
    <span className={styles.fact}>
      <Icon size={13} />
      <span>{text}</span>
    </span>
  );
}

export function deadlineText(job: JobListItem) {
  if (job.dDay === null) return deadlineTypeLabels[job.deadlineType];
  if (job.dDay < 0) return "마감";
  if (job.dDay === 0) return "오늘 마감";
  return `D-${job.dDay}`;
}

export function experienceText(job: JobListItem) {
  if (job.minExperienceYears === null && job.maxExperienceYears === null) {
    return "불명확";
  }
  if (job.minExperienceYears !== null && job.maxExperienceYears !== null) {
    return `${job.minExperienceYears}~${job.maxExperienceYears}년`;
  }
  if (job.minExperienceYears !== null) {
    return `${job.minExperienceYears}년 이상`;
  }
  return `${job.maxExperienceYears}년 이하`;
}

export function trainingInstitutionText(value: boolean | null) {
  if (value === true) return "인정 가능";
  if (value === false) return "인정 불가";
  return "확인 필요";
}
