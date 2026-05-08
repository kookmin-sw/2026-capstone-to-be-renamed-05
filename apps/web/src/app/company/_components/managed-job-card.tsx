import type { CompanyManagedJobItem, JobSubmissionItem } from "@cpa/shared";
import { PencilLine, Trash2 } from "lucide-react";
import { Badge } from "./badge";
import { Info } from "./info";
import { deadlineLabel, experienceLabel } from "../_lib/formatters";
import {
  ActionButton,
  ActionLink,
  actionButtonClassName,
} from "@/components/ui/action-button";
import {
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "../company-page.module.css";

export function ManagedJobCard({
  job,
  onEdit,
  onClose,
  onEditPending,
  onCancelPending,
}: {
  job: CompanyManagedJobItem;
  onEdit: () => void;
  onClose: () => void;
  onEditPending: (submission: JobSubmissionItem) => void;
  onCancelPending: (submission: JobSubmissionItem) => void;
}) {
  const isOpen = job.status === "OPEN";
  const pendingEdit = job.pendingEditSubmission;

  return (
    <article className={cn(styles.jobCard, isOpen ? styles.jobCardOpen : styles.jobCardClosed)}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMain}>
          <div className={styles.badgeRow}>
            <Badge tone={isOpen ? "brand" : "muted"}>
              {isOpen ? "게시 중" : "삭제 처리"}
            </Badge>
            {pendingEdit ? <Badge tone="brand">수정 검수 대기</Badge> : null}
          </div>
          <h3 className={styles.cardTitle}>{job.title}</h3>
          <p className={styles.cardMeta}>
            {jobFamilyLabels[job.jobFamily]} ·{" "}
            {employmentLabels[job.employmentType]} ·{" "}
            {job.location ?? "지역 불명확"}
          </p>
        </div>
        <div className={styles.actionGroup}>
          {isOpen ? (
            <ActionLink
              variant="subtle"
              size="sm"
              href={`/jobs/${job.id}`}
            >
              보기
            </ActionLink>
          ) : (
            <span
              className={cn(
                actionButtonClassName({ variant: "subtle", size: "sm" }),
                styles.disabledAction,
              )}
            >
              비공개
            </span>
          )}
          <ActionButton
            variant="subtle"
            size="sm"
            disabled={!isOpen || Boolean(pendingEdit)}
            type="button"
            iconStart={<PencilLine size={15} />}
            onClick={onEdit}
          >
            수정 요청
          </ActionButton>
          {pendingEdit ? (
            <>
              <ActionButton
                variant="outline"
                size="sm"
                type="button"
                iconStart={<PencilLine size={15} />}
                onClick={() => onEditPending(pendingEdit)}
              >
                요청 수정
              </ActionButton>
              <ActionButton
                variant="subtle"
                size="sm"
                type="button"
                onClick={() => onCancelPending(pendingEdit)}
              >
                요청 취소
              </ActionButton>
            </>
          ) : null}
          <ActionButton
            variant="primary"
            size="sm"
            disabled={!isOpen}
            type="button"
            iconStart={<Trash2 size={15} />}
            onClick={onClose}
          >
            삭제
          </ActionButton>
        </div>
      </div>
      <div className={styles.infoGrid}>
        <Info label="KICPA" value={kicpaLabels[job.kicpaCondition]} />
        <Info label="수습" value={traineeLabels[job.traineeStatus]} />
        <Info
          label="실무수습"
          value={
            job.practicalTrainingInstitution === null
              ? "불명확"
              : job.practicalTrainingInstitution
                ? "가능"
                : "불가"
          }
        />
        <Info label="경력" value={experienceLabel(job)} />
        <Info label="마감" value={deadlineLabel(job)} />
        <Info
          label="최종 확인"
          value={new Date(job.lastCheckedAt).toLocaleDateString("ko-KR")}
        />
      </div>
    </article>
  );
}
