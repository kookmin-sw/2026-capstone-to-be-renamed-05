import type { ReactNode } from "react";
import styles from "../company-page.module.css";

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.metric}>
      {icon ? <div className={styles.metricIcon}>{icon}</div> : null}
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
      </div>
    </div>
  );
}
