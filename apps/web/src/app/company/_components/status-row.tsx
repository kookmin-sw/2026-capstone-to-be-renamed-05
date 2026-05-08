import { cn } from "@/lib/utils";
import { statusLabel } from "../_lib/formatters";
import { Badge } from "./badge";
import styles from "../company-page.module.css";

type BadgeTone = "brand" | "muted" | "success" | "danger" | "pending";

function statusTone(status: string): BadgeTone {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "pending";
}

function dotClass(status: string): string {
  if (status === "APPROVED") return styles.timelineDotSuccess;
  if (status === "REJECTED") return styles.timelineDotDanger;
  return styles.timelineDotPending;
}

export function StatusRow({
  title,
  status,
  type,
  meta,
}: {
  title: string;
  status: string;
  type: string;
  meta: string;
}) {
  return (
    <div className={styles.timelineItem}>
      <span className={cn(styles.timelineDot, dotClass(status))} />
      <div className={styles.timelineHeader}>
        <p className={styles.timelineTitle}>{title}</p>
        <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
      </div>
      <p className={styles.timelineMeta}>
        {type === "EDIT" ? "수정 요청" : "신규 게시"} · {meta}
      </p>
    </div>
  );
}
