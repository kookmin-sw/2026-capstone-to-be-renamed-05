import { statusLabel } from "../_lib/formatters";
import styles from "../company-page.module.css";

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
    <div className={styles.statusRow}>
      <div className={styles.statusRowHeader}>
        <p className={styles.statusTitle}>{title}</p>
        <span className={styles.statusValue}>{statusLabel(status)}</span>
      </div>
      <p className={styles.statusMeta}>
        {type === "UPDATE" ? "수정 요청" : "신규 게시"} · {meta}
      </p>
    </div>
  );
}
