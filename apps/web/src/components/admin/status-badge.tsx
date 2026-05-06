import {
  jobStatusLabels,
  userRoleLabels,
  type JobStatus,
} from "@/components/admin/admin-demo-data";
import { cn } from "@/lib/utils";
import styles from "./admin.module.css";

const jobStatusClasses: Record<JobStatus, string> = {
  OPEN: styles.statusOpen,
  CLOSED: styles.statusClosed,
  DRAFT: styles.statusDraft,
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(styles.statusBadge, jobStatusClasses[status])}
    >
      {jobStatusLabels[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={styles.roleBadge}>
      {userRoleLabels[role] ?? role}
    </span>
  );
}
