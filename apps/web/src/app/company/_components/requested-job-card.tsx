import type { JobSubmissionItem } from "@cpa/shared";
import { PencilLine, Trash2 } from "lucide-react";
import { Badge } from "./badge";
import { Info } from "./info";
import { deadlineLabel, experienceLabel } from "../_lib/formatters";
import { ActionButton } from "@/components/ui/action-button";
import {
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import styles from "../company-page.module.css";

export function RequestedJobCard({
  submission,
  onEdit,
  onCancel,
}: {
  submission: JobSubmissionItem;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <article className={styles.requestCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMain}>
          <div className={styles.badgeRow}>
            <Badge tone="brand">게시 요청 검수 대기</Badge>
          </div>
          <h3 className={styles.cardTitle}>{submission.title}</h3>
          <p className={styles.cardMeta}>
            {jobFamilyLabels[submission.jobFamily]} ·{" "}
            {employmentLabels[submission.employmentType]} ·{" "}
            {submission.location ?? "지역 불명확"}
          </p>
        </div>
        <div className={styles.actionGroup}>
          <ActionButton
            variant="outline"
            size="sm"
            type="button"
            iconStart={<PencilLine size={15} />}
            onClick={onEdit}
          >
            요청 수정
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            type="button"
            iconStart={<Trash2 size={15} />}
            onClick={onCancel}
          >
            요청 취소
          </ActionButton>
        </div>
      </div>
      <div className={styles.infoGrid}>
        <Info label="KICPA" value={kicpaLabels[submission.kicpaCondition]} />
        <Info label="수습" value={traineeLabels[submission.traineeStatus]} />
        <Info
          label="실무수습"
          value={
            submission.practicalTrainingInstitution === null
              ? "불명확"
              : submission.practicalTrainingInstitution
                ? "가능"
                : "불가"
          }
        />
        <Info label="경력" value={experienceLabel(submission)} />
        <Info label="마감" value={deadlineLabel(submission)} />
        <Info
          label="제출일"
          value={new Date(submission.createdAt).toLocaleDateString("ko-KR")}
        />
      </div>
    </article>
  );
}
