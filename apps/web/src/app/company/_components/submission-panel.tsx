import type { JobSubmissionItem } from "@cpa/shared";
import { CheckCircle2 } from "lucide-react";
import { SectionTitle } from "./section-title";
import { StatusRow } from "./status-row";
import styles from "../company-page.module.css";

export function SubmissionPanel({
  submissions,
}: {
  submissions: JobSubmissionItem[];
}) {
  return (
    <aside className={styles.historyPanel}>
      <SectionTitle
        icon={<CheckCircle2 size={19} />}
        title="요청 이력"
        aside={`${submissions.length.toLocaleString("ko-KR")}건`}
      />
      {submissions.length ? (
        <div className={styles.timeline}>
          {submissions.slice(0, 10).map((submission) => (
            <StatusRow
              key={submission.id}
              title={submission.title}
              status={submission.status}
              type={submission.submissionType}
              meta={
                submission.targetJobTitle
                  ? `대상: ${submission.targetJobTitle}`
                  : new Date(submission.createdAt).toLocaleDateString("ko-KR")
              }
            />
          ))}
        </div>
      ) : (
        <p className={styles.mutedText}>요청 이력이 없습니다.</p>
      )}
    </aside>
  );
}
