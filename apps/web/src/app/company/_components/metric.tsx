import styles from "../company-page.module.css";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </div>
  );
}
