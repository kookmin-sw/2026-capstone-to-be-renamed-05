import styles from "../company-page.module.css";

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.info}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}
